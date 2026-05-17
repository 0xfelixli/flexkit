import { memo } from "react";
import {
  createColumnHelper,
  flexRender,
  type Row,
  type Table,
} from "@tanstack/react-table";
import { Clipboard, Copy, Repeat2, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { type HttpRequest } from "./types";

function getStatusClass(status: number) {
  if (status >= 500) return "status-5xx";
  if (status >= 400) return "status-4xx";
  if (status >= 300) return "status-3xx";
  if (status >= 200) return "status-2xx";

  return "status-other";
}

const columnHelper = createColumnHelper<HttpRequest>();

export const historyColumns = [
  columnHelper.accessor("id", {
    header: "#",
    cell: (info) => <span className="id-cell">{info.getValue()}</span>,
  }),
  columnHelper.accessor("method", {
    header: "Method",
    cell: (info) => (
      <span className={`method method-${info.getValue().toLowerCase()}`}>
        {info.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor("host", {
    header: "Host",
    cell: (info) => (
      <span className="host-cell" title={info.getValue()}>
        {info.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor("path", {
    header: "Path",
    cell: (info) => (
      <span className="path-cell" title={info.getValue()}>
        {info.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: (info) => (
      <span className={`status-code ${getStatusClass(info.getValue())}`}>
        {info.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor("type", {
    header: "Type",
    cell: (info) => <span className="type-cell">{info.getValue()}</span>,
  }),
  columnHelper.accessor("length", {
    header: "Length",
    cell: (info) => <span className="metric-cell">{info.getValue()}</span>,
  }),
  columnHelper.accessor("time", {
    header: "Time",
    cell: (info) => <span className="metric-cell">{info.getValue()}</span>,
  }),
  columnHelper.accessor("risk", {
    header: "Risk",
    cell: (info) => (
      <Badge
        className={`risk risk-${info.getValue().toLowerCase()}`}
        variant="outline"
      >
        {info.getValue()}
      </Badge>
    ),
  }),
];

type HistoryTableProps = {
  onCopyRequest: (request: HttpRequest) => void;
  onCopyResponse: (request: HttpRequest) => void;
  onCopyUrl: (request: HttpRequest) => void;
  onSendToRepeater: (request: HttpRequest) => void;
  onShowHeaders: (request: HttpRequest) => void;
  selectedRequestId: number;
  setSelectedRequestId: (id: number) => void;
  table: Table<HttpRequest>;
};

export const HistoryTable = memo(function HistoryTable({
  onCopyRequest,
  onCopyResponse,
  onCopyUrl,
  onSendToRepeater,
  onShowHeaders,
  selectedRequestId,
  setSelectedRequestId,
  table,
}: HistoryTableProps) {
  const rows = table.getRowModel().rows;

  return (
    <section className="history-table" aria-label="HTTP history">
      <table>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </th>
              ))}
              <th className="history-actions-header">Actions</th>
            </tr>
          ))}
        </thead>
        <tbody>
          {rows.map((row) => (
            <HistoryRow
              key={row.id}
              onCopyRequest={onCopyRequest}
              onCopyResponse={onCopyResponse}
              onCopyUrl={onCopyUrl}
              onSendToRepeater={onSendToRepeater}
              onShowHeaders={onShowHeaders}
              isSelected={row.original.id === selectedRequestId}
              row={row}
              setSelectedRequestId={setSelectedRequestId}
            />
          ))}
        </tbody>
      </table>
      {rows.length === 0 ? (
        <div className="empty-state">
          <strong>No traffic captured</strong>
          <span>Start capture to populate HTTP history entries.</span>
        </div>
      ) : null}
    </section>
  );
});

type HistoryRowProps = {
  onCopyRequest: (request: HttpRequest) => void;
  onCopyResponse: (request: HttpRequest) => void;
  onCopyUrl: (request: HttpRequest) => void;
  onSendToRepeater: (request: HttpRequest) => void;
  onShowHeaders: (request: HttpRequest) => void;
  isSelected: boolean;
  row: Row<HttpRequest>;
  setSelectedRequestId: (id: number) => void;
};

const HistoryRow = memo(function HistoryRow({
  onCopyRequest,
  onCopyResponse,
  onCopyUrl,
  onSendToRepeater,
  onShowHeaders,
  isSelected,
  row,
  setSelectedRequestId,
}: HistoryRowProps) {
  const request = row.original;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <tr
          aria-selected={isSelected}
          className={isSelected ? "history-row selected" : "history-row"}
          onClick={() => setSelectedRequestId(request.id)}
          tabIndex={0}
        >
          {row.getVisibleCells().map((cell) => (
            <td key={cell.id}>
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </td>
          ))}
          <td className="history-actions-cell">
            <div className="history-row-actions">
              <Button
                className="chrome-button"
                onClick={(event) => {
                  event.stopPropagation();
                  onSendToRepeater(request);
                }}
                size="icon-xs"
                title="Send to Repeater"
                variant="ghost"
              >
                <Repeat2 />
              </Button>
              <Button
                className="chrome-button"
                onClick={(event) => {
                  event.stopPropagation();
                  onCopyUrl(request);
                }}
                size="icon-xs"
                title="Copy URL"
                variant="ghost"
              >
                <Copy />
              </Button>
            </div>
          </td>
        </tr>
      </ContextMenuTrigger>
      <ContextMenuContent className="workbench-context-menu">
        <ContextMenuItem onSelect={() => onSendToRepeater(request)}>
          <Repeat2 />
          Send to Repeater
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => onCopyUrl(request)}>
          <Copy />
          Copy URL
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => onCopyRequest(request)}>
          <Clipboard />
          Copy request
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => onCopyResponse(request)}>
          <Clipboard />
          Copy response
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={() => onShowHeaders(request)}>
          <ShieldCheck />
          Show headers
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
});
