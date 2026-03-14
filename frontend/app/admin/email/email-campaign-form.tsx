"use client";

import { useState, useMemo } from "react";

type Recipient = {
  email: string;
  name?: string | null;
  type: "subscriber" | "user";
};

type Props = {
  subscribers: Recipient[];
  users: Recipient[];
  resendConfigured: boolean;
};

export function EmailCampaignForm({ subscribers, users, resendConfigured }: Props) {
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [recipientType, setRecipientType] = useState<"all" | "subscribers" | "users" | "custom">("subscribers");
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const allRecipients = useMemo(() => {
    const emailMap = new Map<string, Recipient>();
    subscribers.forEach(s => emailMap.set(s.email, s));
    users.forEach(u => {
      if (!emailMap.has(u.email)) {
        emailMap.set(u.email, u);
      }
    });
    return Array.from(emailMap.values());
  }, [subscribers, users]);

  const filteredRecipients = useMemo(() => {
    let list: Recipient[] = [];
    if (recipientType === "all") list = allRecipients;
    else if (recipientType === "subscribers") list = subscribers;
    else if (recipientType === "users") list = users;
    else list = allRecipients;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter(r => 
        r.email.toLowerCase().includes(term) || 
        r.name?.toLowerCase().includes(term)
      );
    }
    return list;
  }, [recipientType, subscribers, users, allRecipients, searchTerm]);

  const getRecipientList = (): string[] => {
    if (recipientType === "custom") {
      return Array.from(selectedEmails);
    }
    return filteredRecipients.map(r => r.email);
  };

  const toggleEmail = (email: string) => {
    const newSet = new Set(selectedEmails);
    if (newSet.has(email)) {
      newSet.delete(email);
    } else {
      newSet.add(email);
    }
    setSelectedEmails(newSet);
  };

  const selectAll = () => {
    setSelectedEmails(new Set(filteredRecipients.map(r => r.email)));
  };

  const deselectAll = () => {
    setSelectedEmails(new Set());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const recipients = getRecipientList();
    if (recipients.length === 0) {
      setStatus("error");
      setMessage("Please select at least one recipient");
      return;
    }

    if (!name || !subject || !content) {
      setStatus("error");
      setMessage("Please fill in all fields");
      return;
    }

    setStatus("sending");
    setMessage("");

    try {
      const res = await fetch("/api/admin/email-campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          subject,
          htmlContent: wrapInEmailTemplate(content),
          recipients,
          sendNow: true,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage(data.message || `Campaign sent to ${data.sentCount} recipients!`);
        setName("");
        setSubject("");
        setContent("");
        setSelectedEmails(new Set());
      } else {
        setStatus("error");
        setMessage(data.error || "Failed to send campaign");
      }
    } catch {
      setStatus("error");
      setMessage("Failed to send campaign");
    }
  };

  if (!resendConfigured) {
    return (
      <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
        Configure Resend to send email campaigns.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column: Campaign Details */}
        <div className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="campaign-name" className="block text-sm font-medium text-stone-700">
              Campaign Name
            </label>
            <input
              id="campaign-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., March Newsletter"
              className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              required
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="subject" className="block text-sm font-medium text-stone-700">
              Email Subject
            </label>
            <input
              id="subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., New arrivals at YerbaTea!"
              className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              required
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="content" className="block text-sm font-medium text-stone-700">
              Email Content
            </label>
            <textarea
              id="content"
              rows={8}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your email content here. You can use basic HTML tags like <b>, <i>, <a href='...'>, <br>, <p>."
              className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              required
            />
            <p className="text-xs text-stone-500">Supports basic HTML formatting</p>
          </div>
        </div>

        {/* Right Column: Recipients */}
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-stone-700">Recipients</label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: "subscribers", label: `Subscribers (${subscribers.length})` },
                { value: "users", label: `Users (${users.length})` },
                { value: "all", label: `All (${allRecipients.length})` },
                { value: "custom", label: "Custom Selection" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRecipientType(opt.value as typeof recipientType)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    recipientType === opt.value
                      ? "bg-[#344e41] text-[#dad7cd]"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {recipientType === "custom" && (
            <>
              <div className="space-y-1">
                <input
                  type="text"
                  placeholder="Search by email or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-xs text-teal-600 hover:text-teal-700"
                >
                  Select all
                </button>
                <button
                  type="button"
                  onClick={deselectAll}
                  className="text-xs text-stone-500 hover:text-stone-600"
                >
                  Deselect all
                </button>
                <span className="text-xs text-stone-500">
                  {selectedEmails.size} selected
                </span>
              </div>

              <div className="max-h-48 overflow-y-auto rounded-xl border border-stone-200 bg-stone-50 p-2">
                {filteredRecipients.length === 0 ? (
                  <p className="py-4 text-center text-sm text-stone-500">No recipients found</p>
                ) : (
                  <ul className="space-y-1">
                    {filteredRecipients.map((r) => (
                      <li key={r.email}>
                        <label className="flex cursor-pointer items-center gap-2 rounded-lg p-2 text-sm hover:bg-stone-100">
                          <input
                            type="checkbox"
                            checked={selectedEmails.has(r.email)}
                            onChange={() => toggleEmail(r.email)}
                            className="h-4 w-4 rounded border-stone-300 text-teal-600 focus:ring-teal-500"
                          />
                          <span className="text-stone-900">{r.email}</span>
                          {r.name && <span className="text-stone-500">({r.name})</span>}
                          <span className={`ml-auto text-xs ${r.type === 'subscriber' ? 'text-teal-600' : 'text-blue-600'}`}>
                            {r.type}
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}

          {recipientType !== "custom" && (
            <div className="rounded-xl bg-stone-50 p-4 text-sm text-stone-600">
              <p className="font-medium text-stone-900">
                Will send to {filteredRecipients.length} recipients
              </p>
              <p className="mt-1 text-xs">
                {recipientType === "subscribers" && "All newsletter subscribers"}
                {recipientType === "users" && "All registered users"}
                {recipientType === "all" && "All subscribers and users"}
              </p>
            </div>
          )}
        </div>
      </div>

      {message && (
        <p className={`text-sm ${status === "success" ? "text-teal-600" : "text-red-600"}`}>
          {message}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={status === "sending"}
          className="rounded-2xl bg-[#344e41] px-6 py-2 text-sm font-medium text-[#dad7cd] transition hover:bg-[#24352b] disabled:bg-[#4e6a5a]"
        >
          {status === "sending" ? "Sending..." : "Send Campaign"}
        </button>
      </div>
    </form>
  );
}

function wrapInEmailTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #18181b; line-height: 1.6;">
  ${content.replace(/\n/g, '<br>')}
  <hr style="margin: 32px 0; border: none; border-top: 1px solid #e4e4e7;">
  <p style="color: #71717a; font-size: 12px; margin: 0;">
    You received this email because you subscribed to YerbaTea.
    <br>
    <a href="${process.env.NEXT_PUBLIC_APP_ORIGIN || 'https://yerbatea.lv'}" style="color: #0d9488;">Visit our store</a>
  </p>
</body>
</html>`;
}
