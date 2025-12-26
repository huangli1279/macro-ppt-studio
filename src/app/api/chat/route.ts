import { NextRequest } from "next/server";
import OpenAI from "openai";
import { tavily } from "@tavily/core";

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL || undefined,
});

// Initialize Tavily client
const tavilyClient = tavily({ apiKey: process.env.TAVILY_API_KEY || "" });

// Tool definition for web search
const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
    {
        type: "function",
        function: {
            name: "search_web",
            description: "搜索互联网获取最新的宏观经济数据、新闻或其他实时信息。当用户询问需要最新数据的问题时使用此工具。",
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

    return `你是一位专业的宏观经济分析专家。你的任务是帮助用户理解和分析宏观经济报告幻灯片的内容，并回答相关问题。

## 当前时间
${timeStr}

## 幻灯片内容
以下是用户当前正在查看的幻灯片及其上下文（前后各2张）：

${context}

## 你的能力
1. 基于幻灯片内容回答用户问题
2. 提供宏观经济分析和解读
3. 使用 search_web 工具搜索最新的宏观经济数据和新闻
4. 帮助用户理解经济指标和趋势

## 回答要求
- 使用中文回答
- 回答应简洁专业
- 如需搜索最新数据，使用 search_web 工具
- 引用幻灯片内容时，注明是来自哪张幻灯片
- 使用 Markdown 格式化回答`;
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

                    // If there are tool calls, execute them
                    if (currentToolCalls.length > 0 && currentToolCalls[0]?.id) {
                        // Notify client about tool call
                        controller.enqueue(
                            encoder.encode(`data: ${JSON.stringify({ type: "tool_call", tool: currentToolCalls[0].name })}\n\n`)
                        );

                        // Prepare tool results
                        const toolResults: OpenAI.Chat.Completions.ChatCompletionToolMessageParam[] = [];

                        for (const toolCall of currentToolCalls) {
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
                                tool_calls: currentToolCalls.map(tc => ({
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
