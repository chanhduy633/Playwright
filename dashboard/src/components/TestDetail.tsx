import type { Spec } from "../types/playwright-result";
import {
  getAttachments,
  getErrorMessage,
  getTestResultData,
  pickImages,
  pickTraces,
  pickVideos,
} from "../services/test.service";

export function TestDetail({ spec }: { spec: Spec | null }) {
  if (!spec) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">
        Chọn một test case để xem chi tiết
      </div>
    );
  }

  const result = getTestResultData(spec);
  const attachments = getAttachments(result);
  const images = pickImages(attachments);
  const videos = pickVideos(attachments);
  const traces = pickTraces(attachments);
  const errorMessage = getErrorMessage(result);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 font-semibold">{spec.title}</h3>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Info label="Status" value={result?.status ?? "-"} />
          <Info
            label="Duration"
            value={result ? `${(result.duration / 1000).toFixed(2)}s` : "-"}
          />
          <Info label="Worker" value={result?.workerIndex ?? "-"} />
          <Info label="Retry" value={result?.retry ?? 0} />
        </div>

        {errorMessage && (
          <pre className="mt-4 max-h-60 overflow-auto whitespace-pre-wrap rounded-lg bg-red-50 p-4 text-xs text-red-700">
            {errorMessage}
          </pre>
        )}
      </div>

      {images.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 font-semibold">Screenshot</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {images.map((a) => (
              <a key={a.url} href={a.url} target="_blank" rel="noreferrer">
                <img
                  src={a.url}
                  alt={a.name}
                  className="max-h-[500px] w-full rounded-lg border object-contain"
                />
                <p className="mt-1 text-xs text-gray-500">{a.name}</p>
              </a>
            ))}
          </div>
        </div>
      )}

      {videos.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 font-semibold">Record</h3>
          {videos.map((a) => (
            <video key={a.url} controls className="w-full rounded-lg" src={a.url} />
          ))}
        </div>
      )}

      {traces.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 font-semibold">Trace</h3>
          <div className="flex flex-wrap gap-2">
            {traces.map((a) => (
              <a
                key={a.url}
                href={a.url}
                download
                className="inline-block rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
              >
                Tải {a.name}.zip
              </a>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-400">
            Mở bằng: npx playwright show-trace &lt;file.zip&gt;
          </p>
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-gray-50 p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 font-semibold text-gray-900">{value}</p>
    </div>
  );
}