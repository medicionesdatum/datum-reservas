import Link from "next/link";
import type { ReactNode } from "react";

export function UpdatedLine({ dateTime, label }: { dateTime: string; label: string }) {
  return (
    <p className="text-sm text-slate-400">
      Actualizado: <time dateTime={dateTime}>{label}</time> · Autor: Equipo de DATUM
    </p>
  );
}

export function H2({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <h2 className="scroll-mt-20 pt-4 text-2xl font-semibold text-white md:text-3xl" id={id}>
      {children}
    </h2>
  );
}

export function DataTable({ caption, head, rows }: { caption: string; head: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-datum-line">
      <table className="w-full min-w-[560px] border-collapse text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-datum-panel text-slate-200">
          <tr>
            {head.map((cell) => (
              <th className="px-5 py-3 font-semibold" key={cell} scope="col">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-datum-line bg-white/[0.025] text-slate-300">
          {rows.map((row) => (
            <tr key={row[0]}>
              {row.map((cell, index) => (
                <td className={`px-5 py-3 ${index === 0 ? "font-semibold text-white" : ""}`} key={cell}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function FaqList({ items }: { items: { question: string; answer: ReactNode }[] }) {
  return (
    <div className="divide-y divide-datum-line rounded-xl border border-datum-line bg-datum-ink/75">
      {items.map((item) => (
        <details className="group px-5 py-1 md:px-7" key={item.question}>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 font-semibold text-white transition hover:text-datum-cyan [&::-webkit-details-marker]:hidden">
            {item.question}
            <span aria-hidden="true" className="text-xl text-datum-cyan transition group-open:rotate-180">
              ⌄
            </span>
          </summary>
          <p className="max-w-3xl pb-6 leading-7 text-slate-300">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}

export function ReserveButton() {
  return (
    <Link
      className="inline-flex rounded bg-datum-cyan px-6 py-3 font-semibold text-datum-ink transition hover:bg-cyan-200"
      href="/"
    >
      Reservar mi medición
    </Link>
  );
}
