import { useEffect, useState } from "react";

import type {
  PlaywrightResult,
  Spec,
} from "../types/playwright-result";

import {
  flattenSpecs,
  getTestResult,
} from "../services/test.service";

import {
  exportTestReportPdf,
} from "../services/pdf.service";

import { StatCard } from "../components/StatCard";
import { TestTable } from "../components/TestTable";
import { TestDetail } from "../components/TestDetail";

export function Dashboard() {
  const [result, setResult] =
    useState<PlaywrightResult | null>(null);

  const [specs, setSpecs] =
    useState<Spec[]>([]);

  const [selected, setSelected] =
    useState<Spec | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const [updatedAt, setUpdatedAt] =
    useState<Date | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getTestResult();

        const list = flattenSpecs(data);

        setResult(data);
        setSpecs(list);
        setUpdatedAt(new Date());
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "Không thể tải kết quả test",
        );
      }
    };

    const timer = setTimeout(load, 0);

    return () => clearTimeout(timer);
  }, []);

  const handleExportPdf = async () => {
    if (!result) return;

    try {
      setError(null);

      await exportTestReportPdf(
        result,
        specs,
      );
    } catch (e) {
      console.error(e);

      setError(
        e instanceof Error
          ? e.message
          : "Không thể xuất PDF",
      );
    }
  };

  if (!result) {
    return (
      <div className="p-10 text-center">
        {error ? (
          <div className="text-red-600">
            {error}
          </div>
        ) : (
          <div className="text-gray-500">
            Đang tải kết quả test...
          </div>
        )}
      </div>
    );
  }

  const { stats } = result;

  const total =
    stats.expected +
    stats.unexpected +
    stats.skipped +
    stats.flaky;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
        <div>
          <h1 className="text-lg font-bold text-gray-900">
            Playwright Dashboard
          </h1>

          <p className="text-sm text-gray-500">
            Cập nhật lúc{" "}
            {updatedAt?.toLocaleTimeString(
              "vi-VN",
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportPdf}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Export PDF
        </button>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 p-6">
        {/* Error */}
        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <StatCard
            title="Total"
            value={total}
          />

          <StatCard
            title="Passed"
            value={stats.expected}
            tone="success"
          />

          <StatCard
            title="Failed"
            value={stats.unexpected}
            tone="danger"
          />

          <StatCard
            title="Duration"
            value={`${(
              stats.duration / 1000
            ).toFixed(2)}s`}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard
            title="Skipped"
            value={stats.skipped}
            tone="warning"
          />

          <StatCard
            title="Flaky"
            value={stats.flaky}
            tone="warning"
          />

          <StatCard
            title="Workers"
            value={result.config.workers}
          />
        </div>

        {/* Test list */}
        <TestTable
          specs={specs}
          selected={selected}
          onSelect={setSelected}
        />

        {/* Test detail */}
        <TestDetail spec={selected} />
      </main>
    </div>
  );
}