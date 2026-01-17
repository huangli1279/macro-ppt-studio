# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js-based macro-economic presentation studio (macro-ppt-studio) - a web application for creating, editing, and presenting macro-economic analysis reports. It features an AI assistant powered by OpenAI and Tavily web search, with a slide-based presentation system that supports dynamic layouts, multiple chart types (tables, ECharts, images), and PDF export.

## Tech Stack

- **Framework**: Next.js 16.1.0 (App Router)
- **Database**: PostgreSQL via Supabase, Drizzle ORM
- **AI**: OpenAI API for chat, Tavily for web search
- **Charts**: ECharts, custom table renderer
- **PDF Export**: Puppeteer with @sparticuz/chromium
- **UI**: Radix UI components, Tailwind CSS 4
- **Editor**: Monaco Editor for JSON source editing
- **Drag & Drop**: @dnd-kit for slide reordering

## Development Commands

```bash
# Development
npm run dev                    # Start development server

# Build & Deploy
npm run build                  # Build for production
npm run start                  # Start production server

# Database
npm run db:generate            # Generate Drizzle migrations
npm run db:push                # Push schema changes to database
npm run db:studio              # Open Drizzle Studio

# Linting
npm run lint                   # Run ESLint
```

## Environment Variables

Required in `.env`:
- `DATABASE_URL` - Supabase PostgreSQL connection string
- `OPENAI_API_KEY` - OpenAI API key
- `OPENAI_BASE_URL` (optional) - Custom OpenAI base URL
- `OPENAI_MODEL` (optional) - Model name (default: gpt-4o-mini)
- `TAVILY_API_KEY` - Tavily search API key
- `NEXT_PUBLIC_ENABLE_PDF_EXPORT` (optional) - Enable/disable PDF export

## Architecture

### Core Data Model

The application is built around a slide-based presentation model defined in [src/types/slide.ts](src/types/slide.ts):

- **PPTReport**: Array of slides
- **SlideData**: Contains `title`, `content` (array of text points), and `charts` (array of chart configs)
- **ChartConfig**: Supports three types - `table`, `echarts`, `image`

### Database Schema

Two main tables in [src/lib/db/schema.ts](src/lib/db/schema.ts):
- `pptQuarter` - Quarters (e.g., "2024Q4")
- `pptReports` - Reports linked to quarters, stores PPTReport JSON

### API Routes

Located in [src/app/api/](src/app/api/):
- `POST /api/quarters` - Create new quarter
- `GET /api/quarters` - List all quarters
- `GET /api/report?quarterId=X` - Get report for quarter
- `POST /api/report` - Save/update report
- `POST /api/export-pdf` - Generate PDF from slides
- `POST /api/chat` - AI chat with streaming responses

### Key Components

**Presentation Rendering** ([src/components/slide/](src/components/slide/)):
- `SlideRenderer` - Main slide layout engine with automatic layout based on content/chart counts
- `EChartsChart` - ECharts visualization
- `TableChart` - Styled table with cell formatting support
- `ImageChart` - Image display

**Editor** ([src/components/editor/](src/components/editor/)):
- `ThumbnailPanel` - Left sidebar with slide thumbnails and drag-drop reordering
- `SlidePreview` - Main preview area
- `SlideModal` - Add/edit slide dialog
- `CodeEditor` - Monaco-based JSON source editor

**Presentation Mode**:
- `FullscreenPresenter` - Fullscreen slideshow with keyboard navigation

**AI Assistant** ([src/components/ai/ChatBox.tsx](src/components/ai/ChatBox.tsx)):
- Chat interface with slide context awareness
- Can add/update/delete slides via AI tools
- Web search integration for real-time economic data

### Slide Layout System

The renderer automatically selects layouts based on content and chart counts:

- **2 content + 1 chart**: Vertical stack (content on top, chart below)
- **2 content + 2 charts**: Content top, charts side-by-side below
- **3 content + 3 charts**: Split content (2 left, 1 right), asymmetric chart layout
- **4 content + 4 charts**: 2x2 content grid, 2x2 chart grid

Layout logic is in [src/components/slide/SlideRenderer.tsx:87-303](src/components/slide/SlideRenderer.tsx#L87-L303).

### AI Chat System

The chat API ([src/app/api/chat/route.ts](src/app/api/chat/route.ts)) implements:

1. **System Prompt Construction**: Includes current time, slide context (current ±2 slides), and detailed JSON schema for slide manipulation
2. **Tool Calling**:
   - Server-side: `search_web` - Tavily web search for real-time data
   - Client-side: `add_slide`, `update_slide`, `delete_slide` - Direct slide manipulation
3. **Streaming**: Server-sent events for real-time response streaming
4. **Context Awareness**: Slide context extracted via [src/lib/ai-context.ts](src/lib/ai-context.ts)

### PDF Export

Uses Puppeteer in [src/app/api/export-pdf/route.ts](src/app/api/export-pdf/route.ts):
1. Renders slides in a print-optimized page
2. Uses `@sparticuz/chromium` for Lambda-compatible Chrome
3. Generates PDF and returns as blob download

## Important Implementation Details

### Slide JSON Structure

When working with slide data via AI or manual editing, follow this structure:

```typescript
{
  title?: string;              // Optional slide title
  content: string[];           // 1-4 bullet points
  charts: [
    {
      type: "table" | "echarts" | "image",
      data: { /* chart-specific data */ }
    }
  ]
}
```

**Critical constraint**: Content and charts arrays MUST be ≤ 4 items each to avoid layout errors.

### Read-Only Mode

The application supports a read-only mode via URL parameter `?type=read`:
- Hides edit/add/delete buttons
- Disables JSON source editor
- AI can only answer questions, not modify slides

### Styling Conventions

- **Brand color**: `#1a4f99` (deep blue)
- **Title colors**: Always use brand blue
- **Spacing**: Uses Tailwind utilities with fullscreen/preview/thumbnail variants
- **Responsive gaps**: Larger gaps in fullscreen mode (see `isFullscreen` prop usage)

### Database Migrations

When modifying schema:
1. Edit [src/lib/db/schema.ts](src/lib/db/schema.ts)
2. Run `npm run db:generate` to create migration
3. Run `npm run db:push` to apply to database
4. For production, use migration files in `drizzle/` directory

## Common Patterns

### Adding New Chart Types

1. Update `ChartConfig` type in [src/types/slide.ts](src/types/slide.ts)
2. Create new chart component in [src/components/slide/](src/components/slide/)
3. Add case to `ChartRenderer` switch in [src/components/slide/SlideRenderer.tsx:27-38](src/components/slide/SlideRenderer.tsx#L27-L38)
4. Update AI system prompt in chat route with new chart examples

### Modifying Slide Layouts

Layout logic is centralized in `SlideRenderer.renderLayout()`. Changes to layout patterns affect all views (preview, fullscreen, thumbnail). Test thoroughly across different content/chart counts.

### AI Tool Implementation

To add a new AI tool:
1. Add tool definition to `tools` array in [src/app/api/chat/route.ts](src/app/api/chat/route.ts)
2. If server-side: Add handler in tool calls section (lines 407-437)
3. If client-side: Add handler in [ChatBox.tsx](src/components/ai/ChatBox.tsx) via appropriate prop
