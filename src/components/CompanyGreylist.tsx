/**
 * Company Greylist component — ITER-038.
 *
 * Provides a dashboard panel for managing company status:
 * normal / greylist / blacklist.
 *
 * All persistence is local (Dexie). No HH network requests.
 */

import React, { useState, useCallback, useEffect, type ReactNode } from "react";
import type { Company } from "@/models/company";
import {
  setCompanyStatus,
  clearCompanyStatus,
  listAllCompanies,
} from "@/services/company-greylist";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";

// ── Style helpers ──────────────────────────────────────────────────────────

function statusColor(status: Company["status"]): { bg: string; fg: string } {
  switch (status) {
    case "blacklist":
      return { bg: "#212121", fg: "#fff" };
    case "greylist":
      return { bg: "#fcf8e3", fg: "#8a6d3b" };
    case "normal":
    default:
      return { bg: "#e8f5e9", fg: "#388e3c" };
  }
}

function statusLabel(status: Company["status"]): string {
  switch (status) {
    case "blacklist":
      return "Blacklisted";
    case "greylist":
      return "Greylisted";
    case "normal":
      return "Normal";
  }
}

// ── Main component ─────────────────────────────────────────────────────────

export function CompanyGreylistSection(): ReactNode {
  const [companies, setCompanies] = useState<Company[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<Company["status"] | "">("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadCompanies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listAllCompanies();
      setCompanies(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load companies");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCompanies();
  }, [loadCompanies]);

  const handleStatusChange = useCallback(
    async (company: Company, newStatus: Company["status"]) => {
      setUpdatingId(company.id);
      try {
        await setCompanyStatus(
          company.id,
          company.name,
          newStatus,
          newStatus === "blacklist" ? "Manually blacklisted" : undefined,
        );
        await loadCompanies();
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Failed to update company status",
        );
      } finally {
        setUpdatingId(null);
      }
    },
    [loadCompanies],
  );

  const handleClearStatus = useCallback(
    async (company: Company) => {
      setUpdatingId(company.id);
      try {
        await clearCompanyStatus(company.id);
        await loadCompanies();
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Failed to clear company status",
        );
      } finally {
        setUpdatingId(null);
      }
    },
    [loadCompanies],
  );

  if (loading) return <LoadingState message="Loading companies…" />;

  if (error)
    return (
      <ErrorState
        message="Failed to load companies"
        details={error}
        onRetry={() => void loadCompanies()}
      />
    );

  // ── Filtering ──
  const filtered = (companies ?? []).filter((c) => {
    if (statusFilter && c.status !== statusFilter) return false;
    if (
      searchInput &&
      !c.name.toLowerCase().includes(searchInput.toLowerCase())
    )
      return false;
    return true;
  });

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
          Company Greylist ({companies?.length ?? 0})
        </h2>
        <button
          type="button"
          onClick={() => void loadCompanies()}
          style={{
            padding: "2px 10px",
            fontSize: 11,
            cursor: "pointer",
            border: "1px solid #ccc",
            borderRadius: 4,
            background: "#fff",
            color: "#555",
            fontWeight: 500,
          }}
        >
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 16,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <input
          type="text"
          placeholder="Search companies…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          style={{
            padding: "4px 8px",
            fontSize: 12,
            border: "1px solid #ccc",
            borderRadius: 4,
            width: 200,
          }}
        />
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter((e.target.value || "") as Company["status"] | "")
          }
          style={{
            padding: "4px 8px",
            fontSize: 12,
            border: "1px solid #ccc",
            borderRadius: 4,
          }}
        >
          <option value="">All statuses</option>
          <option value="normal">Normal</option>
          <option value="greylist">Greylisted</option>
          <option value="blacklist">Blacklisted</option>
        </select>
      </div>

      {/* Stats */}
      {companies && companies.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: 16,
            marginBottom: 16,
            padding: "8px 12px",
            background: "#f9f9f9",
            borderRadius: 6,
            fontSize: 12,
            color: "#666",
          }}
        >
          <span>
            <strong>
              {companies.filter((c) => c.status === "greylist").length}
            </strong>{" "}
            greylisted
          </span>
          <span>
            <strong>
              {companies.filter((c) => c.status === "blacklist").length}
            </strong>{" "}
            blacklisted
          </span>
          <span>
            <strong>
              {companies.filter((c) => c.status === "normal").length}
            </strong>{" "}
            normal
          </span>
        </div>
      )}

      {/* Content */}
      {!companies || companies.length === 0 ? (
        <EmptyState
          icon="🏢"
          message="No companies found"
          description="Companies will appear here after you save your first vacancy from HH.ru. You can then set greylist or blacklist status for specific employers."
        />
      ) : filtered.length === 0 ? (
        <p style={{ color: "#999", fontSize: 13, fontStyle: "italic" }}>
          No companies match the current filters.
        </p>
      ) : (
        <div>
          {filtered.map((company) => (
            <CompanyRow
              key={company.id}
              company={company}
              updating={updatingId === company.id}
              onStatusChange={(status) => handleStatusChange(company, status)}
              onClear={() => handleClearStatus(company)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Company row ────────────────────────────────────────────────────────────

function CompanyRow({
  company,
  updating,
  onStatusChange,
  onClear,
}: {
  company: Company;
  updating: boolean;
  onStatusChange: (status: Company["status"]) => void;
  onClear: () => void;
}): ReactNode {
  const badge = statusColor(company.status);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 10px",
        borderBottom: "1px solid #f0f0f0",
        fontSize: 13,
        opacity: updating ? 0.5 : 1,
      }}
    >
      {/* Status badge */}
      <span
        style={{
          display: "inline-block",
          padding: "2px 8px",
          borderRadius: 10,
          fontSize: 10,
          fontWeight: 600,
          background: badge.bg,
          color: badge.fg,
          whiteSpace: "nowrap",
          minWidth: 70,
          textAlign: "center",
        }}
      >
        {statusLabel(company.status)}
      </span>

      {/* Company name */}
      <span
        style={{
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          fontWeight: 500,
        }}
        title={company.name}
      >
        {company.name}
      </span>

      {/* Blacklist reason */}
      {company.status === "blacklist" && company.blacklistReason && (
        <span
          style={{
            fontSize: 11,
            color: "#999",
            maxWidth: 200,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {company.blacklistReason}
        </span>
      )}

      {/* Actions */}
      <select
        value={company.status}
        onChange={(e) => onStatusChange(e.target.value as Company["status"])}
        disabled={updating}
        style={{
          padding: "2px 6px",
          fontSize: 11,
          border: "1px solid #ccc",
          borderRadius: 4,
          cursor: "pointer",
        }}
      >
        <option value="normal">Normal</option>
        <option value="greylist">Greylist</option>
        <option value="blacklist">Blacklist</option>
      </select>

      {(company.status === "greylist" || company.status === "blacklist") && (
        <button
          type="button"
          onClick={onClear}
          disabled={updating}
          style={{
            padding: "2px 8px",
            fontSize: 11,
            cursor: "pointer",
            border: "1px solid #ccc",
            borderRadius: 4,
            background: "#fff",
            color: "#d9534f",
            fontWeight: 500,
          }}
        >
          Clear
        </button>
      )}
    </div>
  );
}
