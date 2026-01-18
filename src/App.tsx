import { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { OverlayPanel } from 'primereact/overlaypanel';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import type { DataTableStateEvent } from 'primereact/datatable';
import './App.css';

interface Artwork {
  id: number;
  title: string;
  place_of_origin: string;
  artist_display: string;
  inscriptions: string;
  date_start: number;
  date_end: number;
}

interface ApiResponse {
  data: Artwork[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    total_pages: number;
    current_page: number;
  };
}

function App() {
  const [data, setData] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selectCount, setSelectCount] = useState('');
  const [globalFilter, setGlobalFilter] = useState('');
  const overlayRef = useRef<OverlayPanel>(null);

  const fetchArtworks = async (page: number, searchQuery?: string) => {
    setLoading(true);
    try {
      let url: string;
      if (searchQuery && searchQuery.trim()) {
        // Use search endpoint with server-side search
        const from = (page - 1) * 12;
        url = `https://api.artic.edu/api/v1/artworks/search?q=${encodeURIComponent(searchQuery)}&size=12&from=${from}`;
      } else {
        // Use regular listing endpoint
        url = `https://api.artic.edu/api/v1/artworks?page=${page}&limit=12`;
      }

      const response = await fetch(url);
      const result: ApiResponse = await response.json();
      setData(result.data);
      setTotalRecords(result.pagination.total);
    } catch (error) {
      console.error('Error fetching artworks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArtworks(currentPage, globalFilter);
  }, [currentPage, globalFilter]);

  const onPageChange = (event: DataTableStateEvent) => {
    setCurrentPage((event.page ?? 0) + 1);
  };

  const onGlobalFilterChange = (value: string) => {
    setGlobalFilter(value);
    setCurrentPage(1); // Reset to first page when search changes
  };

  const onSelectionChange = (e: { value: Artwork[] }) => {
    const selected = e.value;
    const newSelected = new Set(selectedRows);
    // Remove deselected from current page
    data.forEach(item => {
      if (!selected.find(s => s.id === item.id)) {
        newSelected.delete(item.id);
      }
    });
    // Add newly selected
    selected.forEach(item => {
      newSelected.add(item.id);
    });
    setSelectedRows(newSelected);
  };

  const handleCustomSelect = () => {
    const count = parseInt(selectCount);
    if (!count || count <= 0) return;
    const toSelect = data.slice(0, Math.min(count, data.length));
    const newSelected = new Set(selectedRows);
    toSelect.forEach(item => newSelected.add(item.id));
    setSelectedRows(newSelected);
    setSelectCount('');
    overlayRef.current?.hide();
  };

  const selectedArtworks = data.filter(item => selectedRows.has(item.id));

  return (
    <div className="App">
      <h1>Artwork Dashboard</h1>
      <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <span>Global Search:</span>
        <InputText
          value={globalFilter}
          onChange={(e) => onGlobalFilterChange(e.target.value)}
          placeholder="Search artworks..."
          style={{ flex: 1 }}
        />
        <Button
          label="Clear"
          onClick={() => setGlobalFilter('')}
          icon="pi pi-times"
        />
        <Button
          label={`Custom Select (${selectedRows.size})`}
          icon="pi pi-plus"
          onClick={(e) => overlayRef.current?.toggle(e)}
        />
      </div>
      <OverlayPanel ref={overlayRef}>
        <div style={{ padding: '1rem' }}>
          <label htmlFor="selectCount">Number of rows to select:</label>
          <InputText
            id="selectCount"
            value={selectCount}
            onChange={(e) => setSelectCount(e.target.value)}
            placeholder="Enter number"
            style={{ marginLeft: '0.5rem' }}
          />
          <Button
            label="Select"
            onClick={handleCustomSelect}
            style={{ marginLeft: '0.5rem' }}
          />
        </div>
      </OverlayPanel>
      <DataTable
        value={data}
        paginator
        rows={12} // assuming 12 per page as per API
        totalRecords={totalRecords}
        lazy
        loading={loading}
        selection={selectedArtworks}
        onSelectionChange={onSelectionChange}
        selectionMode="multiple"
        onPage={onPageChange}
        first={(currentPage - 1) * 12}
        paginatorTemplate={`FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport`}
        currentPageReportTemplate={`Showing ${(currentPage - 1) * 12 + 1} to ${Math.min(currentPage * 12, totalRecords)} of ${totalRecords.toLocaleString()} entries`}
        style={{ width: '100%' }}
      >
        <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
        <Column field="title" header="Title" sortable />
        <Column field="place_of_origin" header="Place of Origin" sortable />
        <Column field="artist_display" header="Artist Display" sortable />
        <Column field="inscriptions" header="Inscriptions" sortable />
        <Column field="date_start" header="Date Start" sortable style={{ minWidth: '120px' }} />
        <Column field="date_end" header="Date End" sortable style={{ minWidth: '120px' }} />
      </DataTable>
    </div>
  );
}

export default App;
