---
trigger: always_on
---

## Project Overview

Macro PPT Studio is a Next.js 16 web application for creating and managing macroeconomic report presentations. Users can configure slides through a visual form editor or JSON source code, with support for tables, ECharts, and images. The app includes slide management, PDF export, fullscreen presentation mode, and data persistence via Supabase.

## Commands

### Development
```bash
npm run dev        # Start development server (http://localhost:3000)
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint
```

### Database (Drizzle ORM + Supabase)
```bash
npm run db:generate  # Generate migration files
npm run db:push      # Push schema changes to database
npm run db:studio    # Open Drizzle Studio for database management
```

## Architecture

### Core Data Flow

1. **Slide Data Structure** (`src/types/slide.ts`):
   - `PPTReport`: Array of `SlideData` objects representing the complete presentation
   - `SlideData`: Contains `title?`, `content[]`, and `charts[]`
   - `ChartConfig`: Type union of `table`, `echarts`, or `image` with associated data
   - Type guards provided: `isTableData()`, `isImageData()`, `isStyledCellValue()`

2. **State Management** (`src/app/page.tsx`):
   - Single source of truth: `slides` state (PPTReport)
   - Dual mode: `preview` (visual) vs `source` (Monaco JSON editor)
   - State synced bi-directionally between preview and source modes
   - Auto-saves to API on slide add/edit/delete operations

3. **Quarter System**:
   - Reports are organized by quarters (e.g., "2024Q4")
   - `ppt_quarter` table stores quarter identifiers
   - `ppt_reports` table stores JSON per quarter (foreign key relationship)
   - Quarter selection loads corresponding report from database

### Component Architecture

**Editor Components** (`src/components/editor/`):
- `ThumbnailPanel`: Left sidebar with slide thumbnails, drag-drop reordering, insert/delete/edit controls
- `SlidePreview`: Main preview area showing current slide at 16:9 aspect ratio
- `SlideModal`: Form dialog for add/edit slide (title, content 0-4, charts 0-4)
- `CodeEditor`: Monaco Editor wrapper for JSON source editing

**Slide Rendering** (`src/components/slide/`):
- `SlideRenderer`: Main renderer with dynamic layout based on content/chart counts
  - Handles 4 layout patterns: 2+1, 2+2, 3+3, 4+4 (content+charts)
  - Responsive sizing for `isThumbnail`, `isFullscreen`, or normal mode
  - Renders WeBank logo and page number
- `TableChart`: Styled table with per-cell CSS styling support
- `EChartsChart`: ECharts integration using `echarts-for-react`
- `ImageChart`: Next.js Image component for external URLs

**Presentation** (`src/components/presentation/`):
- `FullscreenPresenter`: Fullscreen slideshow with keyboard/mouse wheel navigation

### API Routes

- `GET/POST /api/quarters`: List/create quarters
- `GET/POST /api/report`: Fetch/save PPT JSON for a quarter
- `POST /api/export-pdf`: Generate PDF using Puppeteer

### PDF Generation

Located in `src/lib/pdf-generator.ts`:
- Uses Puppeteer (dev: `puppeteer`, prod: `@sparticuz/chromium`)
- Renders each slide individually at `/print?slides={base64}&index={n}`
- Waits for `window.__PRINT_READY__` signal before PDF generation
- Merges individual slide PDFs using `pdf-lib`

## Key Patterns

### Read-Only Mode
- URL parameter `?type=write` controls edit mode
- Default is read-only: hides add/edit/delete/save buttons, disables drag-drop
- Check `isReadOnly` prop in components

### Slide Layout Logic

The `SlideRenderer` component determines layout based on content/chart counts:
- **2 content, 1 chart**: Vertical stack (content → full-width chart)
- **2 content, 2 charts**: Vertical stack (content → side-by-side charts)
- **3 content, 3 charts**: Content split 2+1, charts: left full-height + right stacked 2
- **4 content, 4 charts**: Content split 2+2, charts in 2x2 grid
- **Fallback**: Flexible grid layout

### Source ↔ Preview Sync

When switching from source to preview:
1. Parse JSON from Monaco editor
2. Validate it's an array
3. Update `slides` state
4. If invalid, show alert and stay in source mode

### Drag-Drop Thumbnails

Uses `@dnd-kit` library:
- `DndContext` wraps sortable items
- `SortableContext` provides item IDs: `slide-${index}`
- `useSortable` hook on each thumbnail
- `arrayMove()` reorders after drop
- Updates `selectedIndex` if needed

## Styling

- **Tailwind CSS v4** with `@/*` path alias
- Use `cn()` utility from `@/lib/utils` for conditional classes
- Color scheme: slate for grays, `#1a4f99` for brand blue
- shadcn/ui components in `src/components/ui/`

## Important Constraints

1. **16:9 Aspect Ratio**: All slides render at 16:9 (960x540px base)
2. **Cell Styling**: Table cells support CSS via `StyledCellValue` type
3. **ECharts Config**: Direct passthrough to ECharts options
4. **Print Ready**: PDF generation requires `window.__PRINT_READY__ = true` signal
5. **Quarter Selection**: Required for save/load operations

## Path Aliases

Use `@/*` to reference `src/*`:
- `@/components/ui/button` → `src/components/ui/button`
- `@/types/slide` → `src/types/slide`
- `@/lib/utils` → `src/lib/utils`
