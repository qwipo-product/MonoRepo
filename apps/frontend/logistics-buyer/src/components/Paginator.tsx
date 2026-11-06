import TablePagination from '@mui/material/TablePagination';

interface Props {
  /** Total number of records. */
  length: number;
  /** 0-based page index (mat-paginator semantics). */
  pageIndex: number;
  pageSize: number;
  pageSizeOptions?: number[];
  onPage: (e: { pageIndex: number; pageSize: number }) => void;
  showFirstLastButtons?: boolean;
  disabled?: boolean;
}

/** mat-paginator look-alike: "Items per page: [10 ▾]   1 – 5 of 5   ‹ ›". */
export default function Paginator({ length, pageIndex, pageSize, pageSizeOptions = [5, 10, 25, 50, 100], onPage, showFirstLastButtons, disabled }: Props) {
  return (
    <TablePagination
      component="div"
      className="mat-mdc-paginator"
      count={length}
      page={length === 0 ? 0 : Math.min(pageIndex, Math.max(0, Math.ceil(length / pageSize) - 1))}
      rowsPerPage={pageSize}
      rowsPerPageOptions={pageSizeOptions}
      labelRowsPerPage="Items per page:"
      labelDisplayedRows={({ from, to, count }) => (count === 0 ? `0 of 0` : `${from} – ${to} of ${count}`)}
      onPageChange={(_e, p) => onPage({ pageIndex: p, pageSize })}
      onRowsPerPageChange={(e) => {
        // mat-paginator keeps the first visible item on screen when the page size changes.
        const size = parseInt(e.target.value, 10);
        onPage({ pageIndex: Math.floor((pageIndex * pageSize) / size) || 0, pageSize: size });
      }}
      showFirstButton={showFirstLastButtons}
      showLastButton={showFirstLastButtons}
      disabled={disabled}
      sx={{ '.MuiTablePagination-toolbar': { minHeight: 56 }, fontSize: '.8rem' }}
    />
  );
}
