"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, X, Bot, User, Globe, RotateCcw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { PPTReport } from "@/types/slide";
import { getSlideContext } from "@/lib/ai-context";

interface ToolRequest {
    tool: string;
    args: any;
    status: 'pending' | 'confirmed' | 'cancelled';
}

interface Message {
    role: "user" | "assistant";
    content: string;
    toolRequest?: ToolRequest;
}

interface ToolStatus {
    isActive: boolean;
    toolName?: string;
}

interface ChatBoxProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    slides: PPTReport;
    currentSlideIndex: number;
    isReadOnly?: boolean;
    onAddSlide?: (slide: { title: string; content: string[] }) => Promise<void>;
    onUpdateSlide?: (data: { title?: string; content?: string[] }) => Promise<void>;
    onDeleteSlide?: () => Promise<void>;
}

export function ChatBox({
    open,
    onOpenChange,
    slides,
    currentSlideIndex,
    isReadOnly = false,
    onAddSlide,
    onUpdateSlide,
    onDeleteSlide
}: ChatBoxProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [toolStatus, setToolStatus] = useState<ToolStatus>({ isActive: false });
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Derived state for pending tool
    const hasPendingTool = messages.some(m => m.toolRequest?.status === 'pending');

    // Reset session when dialog opens
    useEffect(() => {
        if (open) {
            setMessages([]);
            setInput("");
            setIsLoading(false);
            setToolStatus({ isActive: false });
        }
    }, [open]);

    // Auto scroll to bottom when new messages arrive
    useEffect(() => {
        if (scrollAreaRef.current) {
            const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]");
            if (scrollContainer) {
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }
        }
    }, [messages, isLoading]);

    // Focus textarea when dialog opens
    useEffect(() => {
        if (open && textareaRef.current) {
            setTimeout(() => textareaRef.current?.focus(), 100);
        }
    }, [open]);

    const handleSend = useCallback(async () => {
        if (!input.trim() || isLoading || hasPendingTool) return;

        const userMessage = input.trim();
        setInput("");
        setMessages(prev => [...prev, { role: "user", content: userMessage }]);
        setIsLoading(true);
        setToolStatus({ isActive: false });

        try {
            // Get slide context
            const context = getSlideContext(currentSlideIndex, slides);
            // Append Edit Mode status to context
            const fullContext = isReadOnly
                ? context
                : `${context}\n\n[System] Current Mode: Edit Mode. You can modify slides.`;

            // Prepare message history for API
            // Filter out internal tool request messages if needed, or keep them as assistant messages?
            // OpenAI expects 'role', 'content'. We can pass the content. keeping plain text history is safe.
            const messageHistory = messages.map(m => ({
                role: m.role,
                content: m.content || (m.toolRequest ? `[Tool Request: ${m.toolRequest.tool}]` : "")
            }));
            messageHistory.push({ role: "user", content: userMessage });

            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: messageHistory,
                    context: fullContext,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to get response");
            }

            // Handle streaming response
            const reader = response.body?.getReader();
            if (!reader) throw new Error("No reader available");

            const decoder = new TextDecoder();
            let assistantContent = "";

            // Add empty assistant message to be updated
            setMessages(prev => [...prev, { role: "assistant", content: "" }]);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split("\n");

                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        const data = line.slice(6);
                        if (data === "[DONE]") continue;

                        try {
                            const parsed = JSON.parse(data);

                            // Handle tool call status
                            if (parsed.type === "tool_call") {
                                setToolStatus({ isActive: true, toolName: parsed.tool });
                            } else if (parsed.type === "tool_result") {
                                setToolStatus({ isActive: false });
                            } else if (parsed.type === "client_tool_call") {
                                // Handle client-side tool execution
                                try {
                                    const args = JSON.parse(parsed.arguments);

                                    if (isReadOnly) {
                                        assistantContent = "无法执行该操作（只读模式）。";
                                        setMessages(prev => {
                                            const newMessages = [...prev];
                                            const lastMessage = newMessages[newMessages.length - 1];
                                            if (lastMessage.role === "assistant") {
                                                lastMessage.content = assistantContent;
                                            }
                                            return newMessages;
                                        });
                                    } else {
                                        // Add a new message for the tool request
                                        setMessages(prev => [...prev, {
                                            role: "assistant",
                                            content: "我需要确认您的操作：",
                                            toolRequest: {
                                                tool: parsed.tool,
                                                args,
                                                status: 'pending'
                                            }
                                        }]);
                                        setIsLoading(false); // Stop loading state while waiting for user
                                        setToolStatus({ isActive: false });
                                    }
                                } catch (e) {
                                    console.error("Client tool parsing failed:", e);
                                    assistantContent = "解析操作请求时发生错误。";
                                    setMessages(prev => {
                                        const newMessages = [...prev];
                                        const lastMessage = newMessages[newMessages.length - 1];
                                        lastMessage.content = assistantContent;
                                        return newMessages;
                                    });
                                }
                            } else if (parsed.type === "content") {
                                assistantContent += parsed.content;
                                setMessages(prev => {
                                    const newMessages = [...prev];
                                    const lastMessage = newMessages[newMessages.length - 1];
                                    if (lastMessage.role === "assistant") {
                                        lastMessage.content = assistantContent;
                                    }
                                    return newMessages;
                                });
                            }
                        } catch {
                            // Not JSON, might be raw text
                            assistantContent += data;
                            setMessages(prev => {
                                const newMessages = [...prev];
                                const lastMessage = newMessages[newMessages.length - 1];
                                if (lastMessage.role === "assistant") {
                                    lastMessage.content = assistantContent;
                                }
                                return newMessages;
                            });
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Chat error:", error);
            setMessages(prev => [
                ...prev,
                { role: "assistant", content: "抱歉，发生了错误。请稍后重试。" }
            ]);
        } finally {
            // We only force loading off if there isn't a pending tool waiting for interaction
            // Actually, handleCancel/Confirm will handle the next steps.
            // If we have a pending tool, we explicitly set isLoading false in the loop.
            // If we don't, we should set it false here.
            // But checking `hasPendingTool` here (outside loop scope) captures the state at start of handleSend?
            // No, the `hasPendingTool` var is from the render scope.
            // We can't rely on `hasPendingTool` here because it's stale.
            // Safe to just set false? If pending tool is set, we want inputs enabled?
            // No, if pending tool, we want main input disabled (handled by hasPendingTool check in render).
            // But we want Chat Buttons (Confirm/Cancel) enabled.
            // So `isLoading` must be false.
            setIsLoading(false);
            setToolStatus({ isActive: false });
        }
    }, [input, isLoading, messages, slides, currentSlideIndex, isReadOnly, hasPendingTool, onAddSlide, onUpdateSlide, onDeleteSlide]);

    const handleConfirmTool = async (index: number) => {
        const msg = messages[index];
        if (!msg.toolRequest || msg.toolRequest.status !== 'pending') return;

        const { tool, args } = msg.toolRequest;

        // Update status to confirmed
        setMessages(prev => prev.map((m, i) =>
            i === index ? { ...m, toolRequest: { ...m.toolRequest!, status: 'confirmed' } } : m
        ));

        setIsLoading(true);

        try {
            let content = "";
            if (tool === "add_slide" && onAddSlide) {
                await onAddSlide(args);
                content = "✅ 已添加新幻灯片";
            } else if (tool === "update_slide" && onUpdateSlide) {
                await onUpdateSlide(args);
                content = "✅ 已更新幻灯片";
            } else if (tool === "delete_slide" && onDeleteSlide) {
                await onDeleteSlide();
                content = "✅ 已删除幻灯片";
            } else {
                content = "❌ 无法执行该操作（功能未实现或参数错误）";
            }

            setMessages(prev => [...prev, { role: "assistant", content }]);
        } catch (e) {
            console.error("Tool execution error:", e);
            setMessages(prev => [...prev, { role: "assistant", content: "❌ 操作执行失败" }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancelTool = (index: number) => {
        setMessages(prev => {
            const newMessages = [...prev];
            if (newMessages[index].toolRequest) {
                newMessages[index] = {
                    ...newMessages[index],
                    toolRequest: { ...newMessages[index].toolRequest!, status: 'cancelled' }
                };
            }
            return [...newMessages, { role: "assistant", content: "🚫 操作已取消" }];
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleReset = useCallback(() => {
        setMessages([]);
        setInput("");
        setIsLoading(false);
        setToolStatus({ isActive: false });
        // Optional: Focus input after reset
        setTimeout(() => textareaRef.current?.focus(), 100);
    }, []);

    const getToolDescription = (tool: string, args: any) => {
        switch (tool) {
            case "add_slide":
                return `添加新幻灯片，标题为 "${args.title}"`;
            case "update_slide":
                return `更新当前幻灯片${args.title ? `，标题为 "${args.title}"` : ""}`;
            case "delete_slide":
                return `删除当前幻灯片`;
            default:
                return `执行未知操作: ${tool}`;
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent showCloseButton={false} className="sm:max-w-[800px] h-[80vh] max-h-[700px] flex flex-col p-0">
                <DialogHeader className="px-6 py-4 border-b border-slate-200 shrink-0 flex flex-row items-center justify-between space-y-0">
                    <DialogTitle className="flex items-center gap-2">
                        <Bot className="h-5 w-5 text-blue-600" />
                        AI 宏观经济分析助手
                    </DialogTitle>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleReset}
                            disabled={isLoading}
                            title="重置会话"
                            className="h-8 w-8 hover:bg-slate-100"
                        >
                            <RotateCcw className={`h-4 w-4 text-slate-500 ${isLoading ? 'opacity-50' : ''}`} />
                        </Button>
                        <DialogClose asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                title="关闭"
                                className="h-8 w-8 hover:bg-slate-100"
                            >
                                <X className="h-4 w-4 text-slate-500" />
                            </Button>
                        </DialogClose>
                    </div>
                </DialogHeader>

                {/* Message List */}
                <ScrollArea ref={scrollAreaRef} className="flex-1 min-h-0">
                    <div className="px-6 py-4 space-y-4">
                        {messages.length === 0 && (
                            <div className="text-center text-slate-500 py-8">
                                <Bot className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                                <p className="text-sm">
                                    你好！我是 AI 宏观经济分析助手。
                                    <br />
                                    我可以帮助你分析当前幻灯片的内容，或搜索最新的宏观经济数据。
                                </p>
                            </div>
                        )}

                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                            >
                                <div
                                    className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.role === "user"
                                        ? "bg-blue-600 text-white"
                                        : "bg-slate-200 text-slate-600"
                                        }`}
                                >
                                    {msg.role === "user" ? (
                                        <User className="h-4 w-4" />
                                    ) : (
                                        <Bot className="h-4 w-4" />
                                    )}
                                </div>
                                <div className="flex flex-col gap-2 max-w-[80%]">
                                    {/* Text Content */}
                                    {msg.content && (
                                        <div
                                            className={`rounded-lg px-4 py-2 overflow-hidden ${msg.role === "user"
                                                ? "bg-blue-600 text-white"
                                                : "bg-slate-100 text-slate-800"
                                                }`}
                                        >
                                            {msg.role === "assistant" ? (
                                                <div className="prose prose-sm prose-slate max-w-none [&>p]:my-1 [&>ul]:my-1 [&>ol]:my-1 break-words">
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                                                </div>
                                            ) : (
                                                <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                                            )}
                                        </div>
                                    )}

                                    {/* Tool Request Card (if present) */}
                                    {msg.toolRequest && (
                                        <div className={`border rounded-lg px-4 py-3 shadow-sm w-full ${msg.toolRequest.status === 'pending'
                                                ? 'bg-white border-blue-200'
                                                : 'bg-slate-50 border-slate-200 opacity-80'
                                            }`}>
                                            <p className={`text-sm font-medium mb-2 ${msg.toolRequest.status === 'pending' ? 'text-slate-800' : 'text-slate-500'
                                                }`}>
                                                {msg.toolRequest.status === 'pending' && "我想要执行以下操作："}
                                                {msg.toolRequest.status === 'confirmed' && "✅ 操作已确认："}
                                                {msg.toolRequest.status === 'cancelled' && "🚫 操作已取消："}
                                            </p>
                                            <div className="bg-slate-100/50 rounded p-2 text-sm text-slate-600 mb-3 font-mono border border-slate-100">
                                                {getToolDescription(msg.toolRequest.tool, msg.toolRequest.args)}
                                            </div>
                                            {msg.toolRequest.status === 'pending' && (
                                                <div className="flex gap-2 justify-end">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleCancelTool(idx)}
                                                        className="h-8"
                                                    >
                                                        取消
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleConfirmTool(idx)}
                                                        className="h-8"
                                                    >
                                                        确认执行
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Loading / Tool Status */}
                        {isLoading && (
                            <div className="flex gap-3">
                                <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-slate-200 text-slate-600">
                                    <Bot className="h-4 w-4" />
                                </div>
                                <div className="bg-slate-100 rounded-lg px-4 py-2 flex items-center gap-2">
                                    {toolStatus.isActive ? (
                                        <>
                                            <Globe className="h-4 w-4 text-blue-600 animate-pulse" />
                                            <span className="text-sm text-slate-600">
                                                正在搜索网络...
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                                            <span className="text-sm text-slate-500">思考中...</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                {/* Input Area */}
                <div className="px-6 py-4 border-t border-slate-200 shrink-0">
                    <div className="flex items-end gap-2">
                        <Textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="输入你的问题..."
                            className="resize-none min-h-[44px] max-h-[120px]"
                            rows={1}
                            disabled={isLoading || hasPendingTool}
                        />
                        <Button
                            size="icon"
                            onClick={handleSend}
                            disabled={!input.trim() || isLoading || hasPendingTool}
                            className="shrink-0 h-[44px] w-[44px]"
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
