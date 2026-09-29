import type { Spec } from "../types/playwright-result";
import { getTestResultData } from "../services/test.service";

interface Props {
  specs: Spec[];
  selected: Spec | null;
  onSelect: (spec: Spec) => void;
}

export function TestTable({ specs, selected, onSelect }: Props) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-5 py-4">
        <h2 className="font-semibold text-gray-900">Test Cases</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-5 py-3">Test</th>
              <th className="px-5 py-3">File</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Duration</th>
              <th className="px-5 py-3">Worker</th>
            </tr>
          </thead>

          <tbody>
            {specs.map((spec) => {
              const result = getTestResultData(spec);
              const passed = spec.ok;

              return (
                <tr
                  key={spec.id}
                  onClick={() => onSelect(spec)}
                  className={`cursor-pointer border-t border-gray-100 hover:bg-gray-50 ${
                    selected?.id === spec.id ? "bg-blue-50" : ""
                  }`}
                >
                  <td className="px-5 py-4 font-medium text-gray-900">{spec.title}</td>
                  <td className="px-5 py-4 text-gray-500">{spec.file}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}
                    >
                      {passed ? "PASSED" : "FAILED"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-600">
                    {result ? `${(result.duration / 1000).toFixed(2)}s` : "-"}
                  </td>
                  <td className="px-5 py-4 text-gray-600">{result?.workerIndex ?? "-"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {specs.length === 0 && (
        <div className="p-10 text-center text-gray-500">Không có test case</div>
      )}
    </div>
  );
}