import { NextRequest } from "next/server";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { streamText, tool, stepCountIs, convertToModelMessages, UIMessage } from "ai";
import { z } from "zod";
import { tavily } from "@tavily/core";

// Initialize OpenAI-compatible provider (uses Chat Completions API, not Responses API)
const provider = createOpenAICompatible({
    name: "openai-compatible",
    apiKey: process.env.OPENAI_API_KEY || "",
    baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
});

// Initialize Tavily client
const tavilyClient = tavily({ apiKey: process.env.TAVILY_API_KEY || "" });

// System prompt template
const SYSTEM_PROMPT_TEMPLATE = `你是一位专业的宏观经济分析专家，同时也是一位乐于助人的AI助手。你的主要任务是帮助用户理解和分析宏观经济报告幻灯片的内容，但你也可以回答用户的其他问题。

## 当前时间
{{CURRENT_TIME}}

## 幻灯片内容
以下是用户当前正在查看的幻灯片及其上下文（前后各2张）：

{{CONTEXT}}

## 回答要求
- 使用中文回答
- 回答应简洁专业
- **积极搜索**：当用户询问"为什么"（Why）类问题，或者询问需要实时信息的问题时，**必须**优先调用 search_web 工具，获取更广阔的背景信息来辅助回答。
- **时间感知**：在使用 search_web 工具时，**必须**在查询词中携带当前的年份和月份（例如"2025年12月"），以确保搜索结果的时效性，避免使用过时的数据。
- 引用幻灯片内容时，注明是来自哪张幻灯片
- 使用 Markdown 格式化回答`;

// Execute Tavily search
async function executeSearch(query: string): Promise<{ context: string; sources: { title: string; url: string }[] }> {
    try {
        const response = await tavilyClient.search(query, {
            maxResults: 5,
            searchDepth: "basic",
        });

        if (!response.results || response.results.length === 0) {
            return { context: "没有找到相关结果。", sources: [] };
        }

        const results = response.results.map((r, i) =>
            `${i + 1}. ${r.title}\n   ${r.content}\n   来源: ${r.url}`
        ).join("\n\n");

        const sources = response.results.map(r => ({ title: r.title, url: r.url }));

        return {
            context: `搜索结果:\n\n${results}`,
            sources
        };
    } catch (error) {
        console.error("Tavily search error:", error);
        return { context: "搜索失败，请稍后重试。", sources: [] };
    }
}

// Build system prompt with context and time
function buildSystemPrompt(context: string, useWebSearch: boolean = false): string {
    const now = new Date();
    const timeStr = now.toLocaleString("zh-CN", {
        timeZone: "Asia/Shanghai",
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long",
        hour: "2-digit",
        minute: "2-digit",
    });

    let prompt = SYSTEM_PROMPT_TEMPLATE
        .replace("{{CURRENT_TIME}}", timeStr)
        .replace("{{CONTEXT}}", context);

    // Append editing capabilities (JSON schema only, tool descriptions are in tool definitions)
    prompt += `\n\n## 幻灯片编辑行为
当用户要求编辑幻灯片时，**直接调用相应工具**，不要解释你将如何操作。

## 幻灯片 JSON 数据规范
为了生成正确的幻灯片数据，请严格参考以下规范：

### 核心约束
- **content**: 字符串数组，最多 4 条
- **charts**: 图表对象数组，最多 4 个
**注意：content 和 charts 的数量均不能超过 4 个，否则会导致布局错误。**
当用户提供的数据较多或需要复杂图表时，请参考此结构：

\`\`\`json
{
  "title": "一线城市中，广深上海社零增速基本回升到全国平均水平，北京持续下行",
  "content": [
    "北京总部型经济特征明显，跨区域设立经营主体明显增加，导致部分单位在京实现的零售额受到一定影响",
    "北京汽车类等大宗商品零售额下降18.3%，主要受燃油车牌获取难、成本高，燃油车市场需求不足影响"
  ],
  "charts": [
    {
      "type": "echarts",
      "data": {
        "title": { "text": "北上广深社会消费品零售总额累计同比(%)" },
        "xAxis": { "type": "category", "data": ["2024-02", "2024-03", "..."] },
        "yAxis": {},
        "series": [
          {
            "name": "北京",
            "type": "line",
            "data": [2.6, -0.1, -0.2, { "value": -5.1, "label": { "show": true, "position": "right" } }]
          }
        ]
      }
    },
    {
      "type": "table",
      "data": {
        "日期": ["2502", "2503"],
        "金银珠宝类": [29.2, 29]
      }
    }
  ]
}
\`\`\``;

    // Append web search instruction if enabled
    if (useWebSearch) {
        prompt += `\n\n## 联网搜索模式
用户已开启联网搜索。对于每个问题，**必须先调用 search_web**，确保回答包含最新信息。

### 搜索来源偏好
优先引用：政府部门、国际组织、知名金融机构、官方媒体、权威智库。
避免引用：非专业自媒体、个人博客、未验证的论坛帖子。

**禁止**在调用工具前输出解释性文字，直接调用 search_web。`;
    }

    return prompt;
}

// Chart schema for Zod validation
const chartSchema = z.object({
    type: z.enum(["table", "echarts", "image"]),
    data: z.record(z.string(), z.any())
});

// Tool definitions using AI SDK v6 tool() helper with inputSchema
const searchWebTool = tool({
    description: "搜索互联网获取最新的实时信息。当用户询问宏观经济数据、新闻或其他需要最新数据的问题时，必须使用此工具。请优先搜索政府、官方机构、权威组织发布的内容。",
    inputSchema: z.object({
        query: z.string().describe("搜索查询词，应该简洁明确"),
    }),
    execute: async ({ query }) => {
        return await executeSearch(query);
    },
});

const addSlideTool = tool({
    description: "在当前演示文稿中添加一张新幻灯片。当用户明确要求添加幻灯片时使用。",
    inputSchema: z.object({
        title: z.string().describe("幻灯片标题"),
        content: z.array(z.string()).describe("幻灯片正文内容要点（文本数组）"),
        charts: z.array(chartSchema).optional().describe("图表配置列表（符合 JSON 指南）"),
        type: z.string().optional().describe("幻灯片布局类型（仅用于提示，实际由内容决定）"),
    }),
    // No execute - client-side tool
});

const updateSlideTool = tool({
    description: "更新当前（正在查看的）幻灯片的内容。当用户要求修改当前幻灯片时使用。",
    inputSchema: z.object({
        title: z.string().optional().describe("新的标题（如果不修改则不传）"),
        content: z.array(z.string()).optional().describe("新的正文内容要点（将完全替换现有内容，如果不修改则不传）"),
        charts: z.array(chartSchema).optional().describe("新的图表配置列表（将完全替换现有图表，如果不修改则不传）"),
    }),
    // No execute - client-side tool
});

const deleteSlideTool = tool({
    description: "删除当前（正在查看的）幻灯片。当用户要求删除当前幻灯片时使用。",
    inputSchema: z.object({}),
    // No execute - client-side tool
});

// Tool sets for different modes
const slideTools = {
    add_slide: addSlideTool,
    update_slide: updateSlideTool,
    delete_slide: deleteSlideTool,
};

const allTools = {
    search_web: searchWebTool,
    ...slideTools,
};

export async function POST(request: NextRequest) {
    try {
        const { messages, context, useWebSearch } = await request.json();

        if (!messages || !Array.isArray(messages)) {
            return new Response(JSON.stringify({ error: "Invalid messages" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Use streamText with convertToModelMessages for better compatibility
        const result = streamText({
            model: provider.chatModel(process.env.OPENAI_MODEL || "gpt-4o-mini"),
            system: buildSystemPrompt(context || "", useWebSearch),
            messages: await convertToModelMessages(messages as UIMessage[]),
            tools: useWebSearch ? allTools : slideTools,
            stopWhen: stepCountIs(5),
        });

        // Return UI message stream response
        return result.toUIMessageStreamResponse();
    } catch (error) {
        console.error("Chat API error:", error);
        return new Response(JSON.stringify({ error: "Internal server error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
