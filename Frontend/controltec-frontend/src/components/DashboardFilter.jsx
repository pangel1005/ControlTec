import React from "react";

export default function DashboardFilter({
    searchTerm,
    onSearchChange,
    filterFase,
    onFilterChange
}) {
    return (
        <div className="vus-filter-bar">
            <div className="search-input-wrapper">
                <svg
                    className="search-icon"
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input
                    type="text"
                    className="search-input"
                    placeholder="Buscar por ID, Solicitante o Servicio..."
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
            </div>

            <select
                className="filter-select"
                value={filterFase}
                onChange={(e) => onFilterChange(e.target.value)}
            >
                <option value="">Todas las Fases</option>
                <option value="depositada">Nuevas Solicitudes</option>
                <option value="depositadafase1">Fase 1 (Drogas/Prec.)</option>
                <option value="depositadafase2">Fase 2 (Finales)</option>
            </select>
        </div>
    );
}
