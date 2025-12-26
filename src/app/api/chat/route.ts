import { NextRequest } from "next/server";
import OpenAI from "openai";
import { tavily } from "@tavily/core";

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL || undefined,
});

// System prompt template
const SYSTEM_PROMPT_TEMPLATE = `你是一位专业的宏观经济分析专家，同时也是一位乐于助人的AI助手。你的主要任务是帮助用户理解和分析宏观经济报告幻灯片的内容，但你也可以回答用户的其他问题。

## 当前时间
{{CURRENT_TIME}}

## 幻灯片内容
以下是用户当前正在查看的幻灯片及其上下文（前后各2张）：

{{CONTEXT}}

## 你的能力
1. 基于幻灯片内容回答用户问题
2. 提供宏观经济分析和解读
3. 使用 search_web 工具搜索最新的宏观经济数据、新闻、天气或其他实时信息
4. 帮助用户理解经济指标和趋势

## 回答要求
- 使用中文回答
- 回答应简洁专业
- **积极搜索**：当用户询问"为什么"（Why）类问题，或者询问需要实时信息的问题时，**必须**优先调用 search_web 工具，获取更广阔的背景信息来辅助回答。
- **时间感知**：在使用 search_web 工具时，**必须**在查询词中携带当前的年份和月份（例如"2025年12月"），以确保搜索结果的时效性，避免使用过时的数据。
- 引用幻灯片内容时，注明是来自哪张幻灯片
- 使用 Markdown 格式化回答`;

// Initialize Tavily client
const tavilyClient = tavily({ apiKey: process.env.TAVILY_API_KEY || "" });

// Tool definition for web search and slide management
const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
    {
        type: "function",
        function: {
            name: "search_web",
            description: "搜索互联网获取最新的实时信息。当用户询问宏观经济数据、新闻、天气或其他需要最新数据的问题时，必须使用此工具。",
            parameters: {
                type: "object",
                properties: {
                    query: {
                        type: "string",
                        description: "搜索查询词，应该简洁明确",
                    },
                },
                required: ["query"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "add_slide",
            description: "在当前演示文稿中添加一张新幻灯片。当用户明确要求添加幻灯片时使用。",
            parameters: {
                type: "object",
                properties: {
                    title: {
                        type: "string",
                        description: "幻灯片标题",
                    },
                    content: {
                        type: "array",
                        items: { type: "string" },
                        description: "幻灯片正文内容要点（文本数组）",
                    },
                    type: {
                        type: "string",
                        enum: ["content_only", "two_charts", "four_charts"],
                        description: "幻灯片布局类型（仅用于提示，实际由内容决定）",
                    }
                },
                required: ["title", "content"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "update_slide",
            description: "更新当前（正在查看的）幻灯片的内容。当用户要求修改当前幻灯片时使用。",
            parameters: {
                type: "object",
                properties: {
                    title: {
                        type: "string",
                        description: "新的标题（如果不修改则不传）",
                    },
                    content: {
                        type: "array",
                        items: { type: "string" },
                        description: "新的正文内容要点（将完全替换现有内容，如果不修改则不传）",
                    },
                },
            },
        },
    },
    {
        type: "function",
        function: {
            name: "delete_slide",
            description: "删除当前（正在查看的）幻灯片。当用户要求删除当前幻灯片时使用。",
            parameters: {
                type: "object",
                properties: {},
            },
        },
    },
];

// Execute Tavily search
async function executeSearch(query: string): Promise<string> {
    try {
        const response = await tavilyClient.search(query, {
            maxResults: 5,
            searchDepth: "basic",
        });

        if (!response.results || response.results.length === 0) {
            return "没有找到相关结果。";
        }

        const results = response.results.map((r, i) =>
            `${i + 1}. ${r.title}\n   ${r.content}\n   来源: ${r.url}`
        ).join("\n\n");

        return `搜索结果:\n\n${results}`;
    } catch (error) {
        console.error("Tavily search error:", error);
        return "搜索失败，请稍后重试。";
    }
}

// Build system prompt with context and time
function buildSystemPrompt(context: string): string {
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

    const isEditMode = context.includes("Edit Mode"); // Simple check or pass explicitly

    let prompt = SYSTEM_PROMPT_TEMPLATE
        .replace("{{CURRENT_TIME}}", timeStr)
        .replace("{{CONTEXT}}", context);

    // Append editing capabilities if applicable
    prompt += `\n\n## 幻灯片编辑能力
你具备直接编辑幻灯片的能力。当用户明确要求添加、修改或删除幻灯片时，**请直接调用相应的工具** (add_slide, update_slide, delete_slide)，而不需要告诉用户你怎么做。
- 添加幻灯片：调用 add_slide
- 修改当前幻灯片：调用 update_slide
- 删除当前幻灯片：调用 delete_slide`;

    return prompt;
}

export async function POST(request: NextRequest) {
    try {
        const { messages, context } = await request.json();

        if (!messages || !Array.isArray(messages)) {
            return new Response(JSON.stringify({ error: "Invalid messages" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Build messages array with system prompt
        const systemMessage: OpenAI.Chat.Completions.ChatCompletionMessageParam = {
            role: "system",
            content: buildSystemPrompt(context || ""),
        };

        const chatMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
            systemMessage,
            ...messages.map((m: { role: string; content: string }) => ({
                role: m.role as "user" | "assistant",
                content: m.content,
            })),
        ];

        // Create streaming response
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    // First API call - may include tool calls
                    let response = await openai.chat.completions.create({
                        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
                        messages: chatMessages,
                        tools,
                        tool_choice: "auto",
                        stream: true,
                    });

                    let currentToolCalls: { id: string; name: string; arguments: string }[] = [];
                    let fullContent = "";

                    // Process streaming response
                    for await (const chunk of response) {
                        const delta = chunk.choices[0]?.delta;

                        // Handle content
                        if (delta?.content) {
                            fullContent += delta.content;
                            controller.enqueue(
                                encoder.encode(`data: ${JSON.stringify({ type: "content", content: delta.content })}\n\n`)
                            );
                        }

                        // Handle tool calls
                        if (delta?.tool_calls) {
                            for (const toolCall of delta.tool_calls) {
                                const index = toolCall.index;
                                if (!currentToolCalls[index]) {
                                    currentToolCalls[index] = {
                                        id: toolCall.id || "",
                                        name: toolCall.function?.name || "",
                                        arguments: "",
                                    };
                                }
                                if (toolCall.id) {
                                    currentToolCalls[index].id = toolCall.id;
                                }
                                if (toolCall.function?.name) {
                                    currentToolCalls[index].name = toolCall.function.name;
                                }
                                if (toolCall.function?.arguments) {
                                    currentToolCalls[index].arguments += toolCall.function.arguments;
                                }
                            }
                        }
                    }

                    // If there are tool calls, categorize them
                    if (currentToolCalls.length > 0) {
                        const clientSideTools = ["add_slide", "update_slide", "delete_slide"];
                        const serverSideToolCalls = currentToolCalls.filter(tc => !clientSideTools.includes(tc.name));
                        const clientToolCalls = currentToolCalls.filter(tc => clientSideTools.includes(tc.name));

                        // 1. Handle Client-side tools (Send to client and STOP)
                        if (clientToolCalls.length > 0) {
                            // We construct a specific event for the client to handle
                            for (const tc of clientToolCalls) {
                                controller.enqueue(
                                    encoder.encode(`data: ${JSON.stringify({
                                        type: "client_tool_call",
                                        tool: tc.name, // add_slide, update_slide, delete_slide
                                        arguments: tc.arguments
                                    })}\n\n`)
                                );
                            }
                            // We stop here for client tools. The client will handle the UI update.
                            // We do NOT recurse for client tools in this design to keep it simple.
                            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                            controller.close();
                            return;
                        }

                        // 2. Handle Server-side tools (Execute and Recurse)
                        if (serverSideToolCalls.length > 0) {
                            // Notify client about tool call (visual feedback only)
                            controller.enqueue(
                                encoder.encode(`data: ${JSON.stringify({ type: "tool_call", tool: serverSideToolCalls[0].name })}\n\n`)
                            );

                            // Prepare tool results
                            const toolResults: OpenAI.Chat.Completions.ChatCompletionToolMessageParam[] = [];

                            for (const toolCall of serverSideToolCalls) {
                                if (toolCall.name === "search_web") {
                                    try {
                                        const args = JSON.parse(toolCall.arguments);
                                        const searchResult = await executeSearch(args.query);
                                        toolResults.push({
                                            role: "tool",
                                            tool_call_id: toolCall.id,
                                            content: searchResult,
                                        });
                                    } catch (e) {
                                        toolResults.push({
                                            role: "tool",
                                            tool_call_id: toolCall.id,
                                            content: "工具调用失败",
                                        });
                                    }
                                }
                            }

                            // Notify tool result
                            controller.enqueue(
                                encoder.encode(`data: ${JSON.stringify({ type: "tool_result" })}\n\n`)
                            );

                            // Make second API call with tool results
                            const secondMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
                                ...chatMessages,
                                {
                                    role: "assistant",
                                    content: fullContent || null,
                                    tool_calls: serverSideToolCalls.map(tc => ({
                                        id: tc.id,
                                        type: "function" as const,
                                        function: {
                                            name: tc.name,
                                            arguments: tc.arguments,
                                        },
                                    })),
                                },
                                ...toolResults,
                            ];

                            const secondResponse = await openai.chat.completions.create({
                                model: process.env.OPENAI_MODEL || "gpt-4o-mini",
                                messages: secondMessages,
                                stream: true,
                            });

                            for await (const chunk of secondResponse) {
                                const delta = chunk.choices[0]?.delta;
                                if (delta?.content) {
                                    controller.enqueue(
                                        encoder.encode(`data: ${JSON.stringify({ type: "content", content: delta.content })}\n\n`)
                                    );
                                }
                            }
                        }
                    }

                    controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                    controller.close();
                } catch (error) {
                    console.error("Stream error:", error);
                    controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({ type: "error", message: "Stream error" })}\n\n`)
                    );
                    controller.close();
                }
            },
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            },
        });
    } catch (error) {
        console.error("Chat API error:", error);
        return new Response(JSON.stringify({ error: "Internal server error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
