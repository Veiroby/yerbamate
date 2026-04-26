"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { EMAIL_TEMPLATE_LABELS, EMAIL_TEMPLATE_KEYS, type EmailTemplateKey } from "@/lib/email-template-registry";

const EmailEditor = dynamic(() => import("react-email-editor"), { ssr: false });

type TemplateRow = {
  key: EmailTemplateKey;
  name: string;
  subject: string;
  html: string;
  designJson: object | null;
  updatedAt: string | null;
};

const TEMPLATE_VARIABLES: Record<EmailTemplateKey, string[]> = {
  marketing_campaign: ["{{siteUrl}}", "{{customerEmail}}"],
  order_confirmation: ["{{orderNumber}}", "{{total}}", "{{currency}}", "{{customerEmail}}", "{{siteUrl}}"],
  wire_transfer_invoice: ["{{orderNumber}}", "{{total}}", "{{currency}}", "{{customerEmail}}", "{{siteUrl}}"],
  unpaid_order_reminder: ["{{orderNumber}}", "{{total}}", "{{currency}}", "{{customerEmail}}", "{{siteUrl}}"],
  abandoned_cart: ["{{cartTotal}}", "{{currency}}", "{{cartUrl}}", "{{siteUrl}}"],
  review_request: ["{{customerName}}", "{{siteUrl}}"],
  password_reset: ["{{resetUrl}}", "{{customerEmail}}", "{{siteUrl}}"],
};

export function EmailTemplateEditor() {
  const editorRef = useRef<any>(null);
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [selectedKey, setSelectedKey] = useState<EmailTemplateKey>("order_confirmation");
  const [subject, setSubject] = useState("");
  const [name, setName] = useState("");
  const [previewHtml, setPreviewHtml] = useState("");
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await fetch("/api/admin/email-templates");
      const data = await res.json();
      setTemplates(data.templates ?? []);
      setLoading(false);
    };
    void load();
  }, []);

  const selected = useMemo(
    () => templates.find((t) => t.key === selectedKey) ?? null,
    [templates, selectedKey],
  );

  useEffect(() => {
    if (!selected) return;
    setSubject(selected.subject ?? "");
    setName(selected.name ?? EMAIL_TEMPLATE_LABELS[selected.key]);
  }, [selected]);

  const handleEditorLoad = () => {
    if (!selected) return;
    if (selected.designJson) {
      editorRef.current?.editor?.loadDesign(selected.designJson);
    } else {
      editorRef.current?.editor?.loadDesign({
        body: {
          rows: [
            {
              cells: [1],
              columns: [
                {
                  contents: [
                    {
                      type: "text",
                      values: {
                        text: `<h1>${EMAIL_TEMPLATE_LABELS[selected.key]}</h1><p>Edit this template and use variables like {{orderNumber}}, {{total}}, {{cartUrl}}.</p>`,
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
      });
    }
  };

  const exportFromEditor = (): Promise<{ html: string; design: object }> =>
    new Promise((resolve) => {
      editorRef.current?.editor?.exportHtml((data: any) => {
        resolve({ html: data?.html ?? "", design: data?.design ?? {} });
      });
    });

  const refreshPreview = async () => {
    const data = await exportFromEditor();
    setPreviewHtml(data.html);
    setStatus("Preview updated.");
  };

  const saveTemplate = async () => {
    const exported = await exportFromEditor();
    const res = await fetch("/api/admin/email-templates", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: selectedKey,
        name,
        subject,
        html: exported.html,
        designJson: exported.design,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setStatus(data.error || "Failed to save template");
      return;
    }
    setStatus("Template saved.");
    setTemplates((prev) =>
      prev.map((t) =>
        t.key === selectedKey
          ? {
              ...t,
              name,
              subject,
              html: exported.html,
              designJson: exported.design,
              updatedAt: new Date().toISOString(),
            }
          : t,
      ),
    );
    setPreviewHtml(exported.html);
  };

  const sendTestEmail = async () => {
    const exported = await exportFromEditor();
    const res = await fetch("/api/admin/email-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: selectedKey,
        subject,
        html: exported.html,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setStatus(data.error || "Failed to send test email");
      return;
    }
    setStatus(`Test email sent to ${data.to}.`);
    setPreviewHtml(exported.html);
  };

  if (loading) {
    return <p className="text-sm text-stone-500">Loading editor...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs text-stone-600">
          Template
          <select
            className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
            value={selectedKey}
            onChange={(e) => setSelectedKey(e.target.value as EmailTemplateKey)}
          >
            {EMAIL_TEMPLATE_KEYS.map((key) => (
              <option key={key} value={key}>
                {EMAIL_TEMPLATE_LABELS[key]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-stone-600">
          Internal name
          <input
            className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-stone-600">
          Subject
          <input
            className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Use variables like {{orderNumber}}"
          />
        </label>
      </div>

      <div className="rounded-xl border border-stone-200 overflow-hidden">
        <EmailEditor ref={editorRef} onLoad={handleEditorLoad} minHeight={560} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={refreshPreview}
          className="rounded-full border border-stone-300 px-4 py-2 text-sm text-stone-700 hover:bg-stone-100"
        >
          Preview
        </button>
        <button
          type="button"
          onClick={saveTemplate}
          className="rounded-full bg-[#344e41] px-4 py-2 text-sm font-medium text-[#dad7cd] hover:bg-[#24352b]"
        >
          Save template
        </button>
        <button
          type="button"
          onClick={sendTestEmail}
          className="rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
        >
          Send test email
        </button>
        {status ? <span className="text-xs text-stone-500">{status}</span> : null}
      </div>

      <section className="rounded-xl border border-stone-200 bg-stone-50 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-600">
          Template variable cheat sheet
        </p>
        <p className="mt-1 text-xs text-stone-500">
          Available placeholders for <strong>{EMAIL_TEMPLATE_LABELS[selectedKey]}</strong>:
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {(TEMPLATE_VARIABLES[selectedKey] ?? []).map((v) => (
            <code key={v} className="rounded bg-white px-2 py-1 text-xs text-stone-700 ring-1 ring-stone-200">
              {v}
            </code>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-stone-500">
          Test emails use sample values for these variables.
        </p>
      </section>

      {previewHtml ? (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-stone-500">Live preview</p>
          <iframe title="email-preview" className="h-[560px] w-full rounded-xl border border-stone-200 bg-white" srcDoc={previewHtml} />
        </div>
      ) : (
        <p className="text-xs text-stone-500">
          Click Preview to render how the template will look.
        </p>
      )}
    </div>
  );
}
