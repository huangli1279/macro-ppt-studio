"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, X, Bot, User, Globe, RotateCcw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { PPTReport } from "@/types/slide";
import { getSlideContext } from "@/lib/ai-context";

interface ChatBoxProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    slides: PPTReport;
    currentSlideIndex: number;
    isReadOnly?: boolean;
    onAddSlide?: (slide: { title: string; content: string[]; charts?: any[] }) => Promise<void>;
    onUpdateSlide?: (data: { title?: string; content?: string[]; charts?: any[] }) => Promise<void>;
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
    const [input, setInput] = useState("");
    const [isWebSearchEnabled, setIsWebSearchEnabled] = useState(false);
    const [pendingToolExecution, setPendingToolExecution] = useState<{
        toolName: string;
        args: any;
    } | null>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // -- Drag & Resize State --
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [size, setSize] = useState({ width: 800, height: 600 });
    const interactionRef = useRef({
        isDragging: false,
        isResizing: false,
        startX: 0,
        startY: 0,
        startPos: { x: 0, y: 0 },
        startSize: { w: 0, h: 0 },
    });

    // Get slide context for API body
    const context = getSlideContext(currentSlideIndex, slides);
    const fullContext = isReadOnly
        ? context
        : `${context}\n\n[System] Current Mode: Edit Mode. You can modify slides.`;

    // useChat hook with AI SDK v6 API
    const { messages, sendMessage, status, setMessages } = useChat({
        transport: new DefaultChatTransport({
            api: "/api/chat",
            // Note: dynamic values like useWebSearch are passed in sendMessage() to avoid stale closures
        }),
        onFinish: ({ message }) => {
            // Check for client-side tool calls in the message parts
            if (message.parts) {
                for (const part of message.parts) {
                    if (part.type.startsWith("tool-") && part.type !== "tool-search_web") {
                        const toolName = part.type.replace("tool-", "");
                        if (["add_slide", "update_slide", "delete_slide"].includes(toolName)) {
                            if (!isReadOnly && "input" in part) {
                                setPendingToolExecution({
                                    toolName,
                                    args: part.input,
                                });
                            }
                        }
                    }
                }
            }
        },
    });

    const isLoading = status === "streaming" || status === "submitted";

    // Reset session when dialog opens
    useEffect(() => {
        if (open) {
            setMessages([]);
            setInput("");
            setPendingToolExecution(null);
        }
    }, [open, setMessages]);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollAreaRef.current) {
            const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
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

    // -- Drag & Resize Handlers --
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const state = interactionRef.current;
            if (state.isDragging) {
                const dx = e.clientX - state.startX;
                const dy = e.clientY - state.startY;
                setPosition({ x: state.startPos.x + dx, y: state.startPos.y + dy });
            } else if (state.isResizing) {
                const dx = e.clientX - state.startX;
                const dy = e.clientY - state.startY;
                setSize({
                    width: Math.max(400, state.startSize.w + dx),
                    height: Math.max(300, state.startSize.h + dy),
                });
            }
        };
        const handleMouseUp = () => {
            interactionRef.current.isDragging = false;
            interactionRef.current.isResizing = false;
        };
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, []);

    const onHeaderMouseDown = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('button')) return;
        interactionRef.current = {
            isDragging: true, isResizing: false,
            startX: e.clientX, startY: e.clientY,
            startPos: { ...position }, startSize: { w: size.width, h: size.height },
        };
    };

    const onResizeMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        interactionRef.current = {
            isDragging: false, isResizing: true,
            startX: e.clientX, startY: e.clientY,
            startPos: { ...position }, startSize: { w: size.width, h: size.height },
        };
    };

    // Handle send message
    const handleSend = useCallback(() => {
        if (!input.trim() || isLoading || pendingToolExecution) return;
        // Pass dynamic body options here to avoid stale closures
        sendMessage(
            { text: input.trim() },
            {
                body: {
                    context: fullContext,
                    useWebSearch: isWebSearchEnabled,
                },
            }
        );
        setInput("");
    }, [input, isLoading, pendingToolExecution, sendMessage, fullContext, isWebSearchEnabled]);

    // Handle keyboard submit
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            if (e.nativeEvent.isComposing) return;
            e.preventDefault();
            handleSend();
        }
    };

    // Reset chat
    const handleReset = useCallback(() => {
        setMessages([]);
        setInput("");
        setPendingToolExecution(null);
        setTimeout(() => textareaRef.current?.focus(), 100);
    }, [setMessages]);

    // Confirm tool execution
    const handleConfirmTool = async () => {
        if (!pendingToolExecution) return;
        const { toolName, args } = pendingToolExecution;

        try {
            let resultText = "";
            if (toolName === "add_slide" && onAddSlide) {
                await onAddSlide(args);
                resultText = "✅ 已添加新幻灯片";
            } else if (toolName === "update_slide" && onUpdateSlide) {
                await onUpdateSlide(args);
                resultText = "✅ 已更新幻灯片";
            } else if (toolName === "delete_slide" && onDeleteSlide) {
                await onDeleteSlide();
                resultText = "✅ 已删除幻灯片";
            } else {
                resultText = "❌ 无法执行该操作";
            }
            // Add result as a new message
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: "assistant",
                parts: [{ type: "text", text: resultText }],
            }]);
        } catch (e) {
            console.error("Tool execution error:", e);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: "assistant",
                parts: [{ type: "text", text: "❌ 操作执行失败" }],
            }]);
        } finally {
            setPendingToolExecution(null);
        }
    };

    // Cancel tool execution
    const handleCancelTool = () => {
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: "assistant",
            parts: [{ type: "text", text: "🚫 操作已取消" }],
        }]);
        setPendingToolExecution(null);
    };

    // Get tool description for display
    const getToolDescription = (toolName: string, args: any) => {
        switch (toolName) {
            case "add_slide":
                return `添加新幻灯片，标题为 "${args?.title}"${args?.charts ? `，包含 ${args.charts.length} 个图表` : ""}`;
            case "update_slide":
                return `更新当前幻灯片${args?.title ? `，标题为 "${args.title}"` : ""}`;
            case "delete_slide":
                return `删除当前幻灯片`;
            default:
                return `执行操作: ${toolName}`;
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                id="chat-box-content"
                showCloseButton={false}
                className="p-0 flex flex-col shadow-xl border border-slate-200"
                style={{
                    translate: `calc(-50% + ${position.x}px) calc(-50% + ${position.y}px)`,
                    width: `${size.width}px`,
                    height: `${size.height}px`,
                    maxHeight: 'none',
                    maxWidth: 'none',
                }}
            >
                <DialogHeader
                    className="px-6 py-4 border-b border-slate-200 shrink-0 flex flex-row items-center justify-between space-y-0 cursor-move"
                    onMouseDown={onHeaderMouseDown}
                >
                    <DialogTitle className="flex items-center gap-2 select-none">
                        <Bot className="h-5 w-5 text-blue-600" />
                        AI 宏观经济分析助手
                    </DialogTitle>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={handleReset} disabled={isLoading}
                            title="重置会话" className="h-8 w-8 hover:bg-slate-100" onMouseDown={(e) => e.stopPropagation()}>
                            <RotateCcw className={`h-4 w-4 text-slate-500 ${isLoading ? 'opacity-50' : ''}`} />
                        </Button>
                        <DialogClose asChild>
                            <Button variant="ghost" size="icon" title="关闭" className="h-8 w-8 hover:bg-slate-100"
                                onMouseDown={(e) => e.stopPropagation()}>
                                <X className="h-4 w-4 text-slate-500" />
                            </Button>
                        </DialogClose>
                    </div>
                </DialogHeader>

                {/* Message List */}
                <ScrollArea ref={scrollAreaRef} className="flex-1 min-h-0">
                    <div className="px-6 py-4 space-y-4">
                        {messages.length === 0 && (
                            <div className="text-center text-slate-500 py-8 select-none">
                                <Bot className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                                <p className="text-sm">
                                    你好！我是 AI 宏观经济分析助手。
                                    <br />
                                    我可以帮助你分析当前幻灯片的内容，或搜索最新的宏观经济数据。
                                </p>
                            </div>
                        )}

                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                                <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.role === "user" ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600"
                                    }`}>
                                    {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                                </div>
                                <div className="flex flex-col gap-2 max-w-[80%]">
                                    {msg.parts.filter(p => p.type === "text").map((part, i) => (
                                        <div key={i} className={`rounded-lg px-4 py-2 overflow-hidden ${msg.role === "user" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-800"
                                            }`}>
                                            {msg.role === "assistant" ? (
                                                <div className="prose prose-sm prose-slate max-w-none [&>p]:my-1 break-words">
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]}
                                                        components={{ a: ({ ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" /> }}>
                                                        {part.text}
                                                    </ReactMarkdown>
                                                </div>
                                            ) : (
                                                <p className="text-sm whitespace-pre-wrap break-words">{part.text}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {/* Pending Tool Confirmation */}
                        {pendingToolExecution && (
                            <div className="flex gap-3">
                                <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-slate-200 text-slate-600">
                                    <Bot className="h-4 w-4" />
                                </div>
                                <div className="border rounded-lg px-4 py-3 shadow-sm bg-white border-blue-200">
                                    <p className="text-sm font-medium mb-2 text-slate-800">我想要执行以下操作：</p>
                                    <div className="bg-slate-100/50 rounded p-2 text-sm text-slate-600 mb-3 font-mono border border-slate-100">
                                        {getToolDescription(pendingToolExecution.toolName, pendingToolExecution.args)}
                                    </div>
                                    <div className="flex gap-2 justify-end">
                                        <Button size="sm" variant="outline" onClick={handleCancelTool} className="h-8">取消</Button>
                                        <Button size="sm" onClick={handleConfirmTool} className="h-8">确认执行</Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Loading Indicator */}
                        {isLoading && !pendingToolExecution && (
                            <div className="flex gap-3">
                                <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-slate-200 text-slate-600">
                                    <Bot className="h-4 w-4" />
                                </div>
                                <div className="bg-slate-100 rounded-lg px-4 py-2 flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                                    <span className="text-sm text-slate-500">思考中...</span>
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                {/* Input Area */}
                <div className="px-6 py-4 border-t border-slate-200 shrink-0 relative">
                    <div className="flex items-end gap-2">
                        <div className="relative flex-1">
                            <Textarea
                                ref={textareaRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="输入你的问题..."
                                className="resize-none min-h-[44px] max-h-[120px] pr-24"
                                rows={1}
                                disabled={isLoading || !!pendingToolExecution}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsWebSearchEnabled(!isWebSearchEnabled)}
                                className={`absolute bottom-2 right-2 h-7 rounded-full text-xs transition-colors border ${isWebSearchEnabled
                                    ? "bg-blue-100 text-blue-600 border-blue-200 hover:bg-blue-200"
                                    : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                                    }`}
                            >
                                <Globe className={`h-3 w-3 mr-1.5 ${isWebSearchEnabled ? "animate-pulse" : ""}`} />
                                联网搜索
                            </Button>
                        </div>
                        <Button size="icon" onClick={handleSend} disabled={!input.trim() || isLoading || !!pendingToolExecution}
                            className="shrink-0 h-[44px] w-[44px]">
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                    </div>

                    {/* Resize Handle */}
                    <div className="absolute bottom-1 right-1 w-4 h-4 cursor-se-resize flex items-center justify-center opacity-50 hover:opacity-100"
                        onMouseDown={onResizeMouseDown}>
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M10 10L10 0L0 10L10 10Z" fill="#94a3b8" /></svg>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
