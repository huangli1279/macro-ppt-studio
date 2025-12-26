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

interface Message {
    role: "user" | "assistant";
    content: string;
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
}

export function ChatBox({ open, onOpenChange, slides, currentSlideIndex }: ChatBoxProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [toolStatus, setToolStatus] = useState<ToolStatus>({ isActive: false });
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

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
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput("");
        setMessages(prev => [...prev, { role: "user", content: userMessage }]);
        setIsLoading(true);
        setToolStatus({ isActive: false });

        try {
            // Get slide context
            const context = getSlideContext(currentSlideIndex, slides);

            // Prepare message history for API
            const messageHistory = [...messages, { role: "user" as const, content: userMessage }];

            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: messageHistory,
                    context,
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
            setIsLoading(false);
            setToolStatus({ isActive: false });
        }
    }, [input, isLoading, messages, slides, currentSlideIndex]);

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
                                <div
                                    className={`max-w-[80%] rounded-lg px-4 py-2 overflow-hidden ${msg.role === "user"
                                        ? "bg-blue-600 text-white"
                                        : "bg-slate-100 text-slate-800"
                                        }`}
                                >
                                    {msg.role === "assistant" ? (
                                        <div className="prose prose-sm prose-slate max-w-none [&>p]:my-1 [&>ul]:my-1 [&>ol]:my-1 break-words">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content || "..."}</ReactMarkdown>
                                        </div>
                                    ) : (
                                        <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
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
                            disabled={isLoading}
                        />
                        <Button
                            size="icon"
                            onClick={handleSend}
                            disabled={!input.trim() || isLoading}
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
