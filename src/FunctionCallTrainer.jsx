import { useState, useCallback } from "react";

const FUNCTIONS = [
  {
    name: "list_threads",
    description: "List email threads, optionally filtered by search query, labels, or spam/trash inclusion.",
    parameters: {
      query: { type: "string", description: "Search query to filter threads" },
      label_ids: { type: "array<string>", description: "Filter by label IDs" },
      max_results: { type: "integer", description: "Maximum number of results" },
      include_spam_trash: { type: "boolean", description: "Include spam and trash" },
    },
    required: [],
  },
  {
    name: "get_thread",
    description: "Retrieve a full email thread by thread ID.",
    parameters: {
      thread_id: { type: "string", description: "The ID of the thread to retrieve" },
    },
    required: ["thread_id"],
  },
  {
    name: "list_messages",
    description: "List individual email messages.",
    parameters: {
      query: { type: "string", description: "Search query" },
      label_ids: { type: "array<string>", description: "Filter by label IDs" },
      max_results: { type: "integer", description: "Maximum number of results" },
    },
    required: [],
  },
  {
    name: "get_message",
    description: "Retrieve a single email message.",
    parameters: {
      message_id: { type: "string", description: "The ID of the message" },
      format: { type: "enum: minimal | metadata | full | raw", description: "Format of the response" },
    },
    required: ["message_id"],
  },
  {
    name: "list_drafts",
    description: "List saved drafts.",
    parameters: {
      max_results: { type: "integer", description: "Maximum number of drafts to list" },
    },
    required: [],
  },
  {
    name: "get_draft",
    description: "Retrieve a draft by ID.",
    parameters: {
      draft_id: { type: "string", description: "The ID of the draft" },
    },
    required: ["draft_id"],
  },
  {
    name: "create_draft",
    description: "Create a new email draft.",
    parameters: {
      to: { type: "array<string>", description: "Recipient email addresses" },
      cc: { type: "array<string>", description: "CC recipients" },
      bcc: { type: "array<string>", description: "BCC recipients" },
      subject: { type: "string", description: "Email subject line" },
      body: { type: "string", description: "Email body content" },
      thread_id: { type: "string", description: "Thread to attach the draft to" },
      attachments: { type: "array<string>", description: "Attachment file paths" },
      from_alias: { type: "string", description: "Send-as alias to use" },
      smime_sign: { type: "boolean", description: "Sign with S/MIME" },
      smime_encrypt: { type: "boolean", description: "Encrypt with S/MIME" },
    },
    required: ["to", "subject", "body"],
  },
  {
    name: "update_draft",
    description: "Update an existing draft.",
    parameters: {
      draft_id: { type: "string", description: "The ID of the draft to update" },
      to: { type: "array<string>", description: "Recipient email addresses" },
      cc: { type: "array<string>", description: "CC recipients" },
      bcc: { type: "array<string>", description: "BCC recipients" },
      subject: { type: "string", description: "Email subject line" },
      body: { type: "string", description: "Email body content" },
    },
    required: ["draft_id"],
  },
  {
    name: "send_draft",
    description: "Send a saved draft.",
    parameters: {
      draft_id: { type: "string", description: "The ID of the draft to send" },
    },
    required: ["draft_id"],
  },
  {
    name: "send_message",
    description: "Send an email immediately without saving a draft.",
    parameters: {
      to: { type: "array<string>", description: "Recipient email addresses" },
      subject: { type: "string", description: "Email subject line" },
      body: { type: "string", description: "Email body content" },
      cc: { type: "array<string>", description: "CC recipients" },
      bcc: { type: "array<string>", description: "BCC recipients" },
      attachments: { type: "array<string>", description: "Attachment file paths" },
      from_alias: { type: "string", description: "Send-as alias to use" },
      smime_sign: { type: "boolean", description: "Sign with S/MIME" },
      smime_encrypt: { type: "boolean", description: "Encrypt with S/MIME" },
    },
    required: ["to", "subject", "body"],
  },
  {
    name: "reply_to_thread",
    description: "Reply to an existing email thread.",
    parameters: {
      thread_id: { type: "string", description: "The ID of the thread to reply to" },
      body: { type: "string", description: "Reply body content" },
      reply_all: { type: "boolean", description: "Reply to all participants" },
    },
    required: ["thread_id", "body"],
  },
  {
    name: "forward_message",
    description: "Forward a message to new recipients.",
    parameters: {
      message_id: { type: "string", description: "The ID of the message to forward" },
      to: { type: "array<string>", description: "Forward recipient addresses" },
      body: { type: "string", description: "Additional body text for the forward" },
    },
    required: ["message_id", "to"],
  },
  {
    name: "archive_thread",
    description: "Archive an email thread (remove from inbox).",
    parameters: {
      thread_id: { type: "string", description: "The ID of the thread to archive" },
    },
    required: ["thread_id"],
  },
  {
    name: "trash_thread",
    description: "Move a thread to trash.",
    parameters: {
      thread_id: { type: "string", description: "The ID of the thread to trash" },
    },
    required: ["thread_id"],
  },
  {
    name: "untrash_thread",
    description: "Restore a thread from trash back to inbox.",
    parameters: {
      thread_id: { type: "string", description: "The ID of the thread to restore" },
    },
    required: ["thread_id"],
  },
  {
    name: "mark_thread_read",
    description: "Mark all messages in a thread as read.",
    parameters: {
      thread_id: { type: "string", description: "The ID of the thread to mark read" },
    },
    required: ["thread_id"],
  },
  {
    name: "mark_thread_unread",
    description: "Mark a thread as unread.",
    parameters: {
      thread_id: { type: "string", description: "The ID of the thread to mark unread" },
    },
    required: ["thread_id"],
  },
  {
    name: "add_label_to_thread",
    description: "Apply one or more labels to a thread.",
    parameters: {
      thread_id: { type: "string", description: "The ID of the thread" },
      label_ids: { type: "array<string>", description: "Label IDs to apply" },
    },
    required: ["thread_id", "label_ids"],
  },
  {
    name: "remove_label_from_thread",
    description: "Remove one or more labels from a thread.",
    parameters: {
      thread_id: { type: "string", description: "The ID of the thread" },
      label_ids: { type: "array<string>", description: "Label IDs to remove" },
    },
    required: ["thread_id", "label_ids"],
  },
  {
    name: "get_attachment",
    description: "Retrieve a specific attachment from a message.",
    parameters: {
      message_id: { type: "string", description: "The ID of the message" },
      attachment_id: { type: "string", description: "The ID of the attachment" },
    },
    required: ["message_id", "attachment_id"],
  },
  {
    name: "create_alias",
    description: "Create a send-as alias for an account.",
    parameters: {
      email: { type: "string", description: "Alias email address" },
      display_name: { type: "string", description: "Display name for the alias" },
    },
    required: ["email"],
  },
  {
    name: "list_smime_certificates",
    description: "List S/MIME certificates associated with an email.",
    parameters: {
      email: { type: "string", description: "Email address to list certificates for" },
      certificate_type: { type: "enum: signing | encryption | all", description: "Type of certificate to filter" },
    },
    required: [],
  },
  {
    name: "add_smime_certificate",
    description: "Add an S/MIME certificate to an account.",
    parameters: {
      email: { type: "string", description: "Email address to associate certificate with" },
      certificate_pem: { type: "string", description: "PEM-encoded certificate data" },
      certificate_type: { type: "enum: signing | encryption", description: "Type of certificate" },
    },
    required: ["email", "certificate_pem", "certificate_type"],
  },
  {
    name: "trash_message",
    description: "Move a single message to trash.",
    parameters: {
      message_id: { type: "string", description: "The ID of the message to trash" },
    },
    required: ["message_id"],
  },
  {
    name: "untrash_message",
    description: "Restore a single message from trash.",
    parameters: {
      message_id: { type: "string", description: "The ID of the message to restore" },
    },
    required: ["message_id"],
  },
];

// const SAMPLE_QUERIES = [
 const SAMPLE_QUERIES = [
  {
    text: "Find the {latest unread} thread from alice@example.com, reply 'Received, thanks', then mark it as read and archive it.",
    hint: "latest unread"
  },
  {
    text: "Locate the draft titled {Q4 Strategy}, update its body to 'Final version attached', send it, then label the resulting thread as 'strategy'.",
    hint: "Q4 Strategy"
  },
  {
    text: "Find the {most recent} message from hr@company.com, forward it to manager@company.com with note 'Please review', then trash the original message.",
    hint: "most recent"
  },
  {
    text: "Get all threads labeled {updates}, remove that label, then archive those threads.",
    hint: "updates"
  },
  {
    text: "Create a new draft to client@example.com with subject 'Proposal', update its body to 'Please find attached proposal', then send it.",
    hint: "Proposal"
  },
  {
    text: "Find the thread with subject {Deployment Issue}, mark it as unread, then reply 'Fix in progress' to all participants.",
    hint: "Deployment Issue"
  },
  {
    text: "Retrieve the {latest} message from support@vendor.com, reply 'Resolved', then move that message to trash.",
    hint: "latest"
  },
  {
    text: "Find the draft with subject {Report}, send it, then archive the thread it belongs to.",
    hint: "Report"
  },
  {
    text: "Find thread from finance@company.com about {invoice}, forward the latest message to ceo@company.com, then mark the thread as read.",
    hint: "invoice"
  },
  {
    text: "Create a new alias reports@company.com, then add an S/MIME signing certificate for it.",
    hint: "reports@company.com"
  },
  {
    text: "Find the {latest thread}, add label 'important', then mark it as unread.",
    hint: "latest thread"
  },
  {
    text: "Find message with subject {Invoice}, trash it, then restore it back.",
    hint: "Invoice"
  }
];
// ];

const FUNCTION_OUTPUTS = {
  list_threads: {
    threads: [
      { id: "18b9f2a3c1d4e5f6", threadId: "18b9f2a3c1d4e5f6", snippet: "Project update attached — please review before the meeting", historyId: "3456789" },
      { id: "18b9f2a3c1d4e5f7", threadId: "18b9f2a3c1d4e5f7", snippet: "Hi, just a reminder about tomorrow's standup at 9am", historyId: "3456790" }
    ],
    nextPageToken: "08234917234",
    resultSizeEstimate: 18
  },
  get_thread: {
    id: "18b9f2a3c1d4e5f6",
    historyId: "3456789",
    messages: [
      {
        id: "18b9f2a3c1d4e5f6",
        threadId: "18b9f2a3c1d4e5f6",
        labelIds: ["INBOX", "UNREAD"],
        snippet: "Project update attached — please review before the meeting",
        internalDate: "1743415920000",
        sizeEstimate: 2048,
        payload: {
          mimeType: "text/plain",
          headers: [
            { name: "From", value: "alice@example.com" },
            { name: "To", value: "me@example.com" },
            { name: "Subject", value: "Project Update" },
            { name: "Date", value: "Wed, 1 Apr 2026 09:12:00 +0000" }
          ],
          body: { size: 512, data: "UHJvamVjdCB1cGRhdGUgYXR0YWNoZWQ..." }
        }
      }
    ]
  },
  list_messages: {
    messages: [
      { id: "18b9f2a3c1d4e5f6", threadId: "18b9f2a3c1d4e5f6" },
      { id: "18b9f2a3c1d4e5f9", threadId: "18b9f2a3c1d4e5f7" }
    ],
    nextPageToken: "08234917235",
    resultSizeEstimate: 7
  },
  get_message: {
    id: "18b9f2a3c1d4e5f6",
    threadId: "18b9f2a3c1d4e5f6",
    labelIds: ["INBOX", "UNREAD"],
    snippet: "Project update attached — please review before the meeting",
    internalDate: "1743415920000",
    sizeEstimate: 2048,
    payload: {
      mimeType: "text/plain",
      headers: [
        { name: "From", value: "alice@example.com" },
        { name: "To", value: "me@example.com" },
        { name: "Subject", value: "Project Update" },
        { name: "Date", value: "Wed, 1 Apr 2026 09:12:00 +0000" }
      ],
      body: { size: 512, data: "UHJvamVjdCB1cGRhdGUgYXR0YWNoZWQ..." }
    }
  },
  list_drafts: {
    drafts: [
      { id: "r7891234567890", message: { id: "18b9f2a3c1d4e5a1", threadId: "18b9f2a3c1d4e5a1" } },
      { id: "r7891234567891", message: { id: "18b9f2a3c1d4e5a2", threadId: "18b9f2a3c1d4e5a2" } }
    ],
    resultSizeEstimate: 2
  },
  get_draft: {
    id: "r7891234567890",
    message: {
      id: "18b9f2a3c1d4e5a1",
      threadId: "18b9f2a3c1d4e5a1",
      labelIds: ["DRAFT"],
      snippet: "Hi team, please find the Q3 report attached...",
      payload: {
        mimeType: "text/plain",
        headers: [
          { name: "To", value: "team@company.com" },
          { name: "Subject", value: "Q3 Report" }
        ],
        body: { size: 256, data: "SGkgdGVhbSwgcGxlYXNlIGZpbmQ..." }
      }
    }
  },
  create_draft: {
    id: "r7891234567892",
    message: {
      id: "18b9f2a3c1d4e5a3",
      threadId: "18b9f2a3c1d4e5a3",
      labelIds: ["DRAFT"]
    }
  },
  update_draft: {
    id: "r7891234567890",
    message: {
      id: "18b9f2a3c1d4e5a1",
      threadId: "18b9f2a3c1d4e5a1",
      labelIds: ["DRAFT"]
    }
  },
  send_draft: {
    id: "18b9f2a3c1d4e5b1",
    threadId: "18b9f2a3c1d4e5a1",
    labelIds: ["SENT"]
  },
  send_message: {
    id: "18b9f2a3c1d4e5b2",
    threadId: "18b9f2a3c1d4e5b2",
    labelIds: ["SENT"]
  },
  reply_to_thread: {
    id: "18b9f2a3c1d4e5b3",
    threadId: "18b9f2a3c1d4e5f6",
    labelIds: ["SENT"]
  },
  forward_message: {
    id: "18b9f2a3c1d4e5b4",
    threadId: "18b9f2a3c1d4e5b4",
    labelIds: ["SENT"]
  },
  archive_thread: {
    id: "18b9f2a3c1d4e5f6",
    historyId: "3456792",
    messages: [
      { id: "18b9f2a3c1d4e5f6", threadId: "18b9f2a3c1d4e5f6", labelIds: [] }
    ]
  },
  trash_thread: {
    id: "18b9f2a3c1d4e5f6",
    historyId: "3456793",
    messages: [
      { id: "18b9f2a3c1d4e5f6", threadId: "18b9f2a3c1d4e5f6", labelIds: ["TRASH"] }
    ]
  },
  untrash_thread: {
    id: "18b9f2a3c1d4e5f6",
    historyId: "3456794",
    messages: [
      { id: "18b9f2a3c1d4e5f6", threadId: "18b9f2a3c1d4e5f6", labelIds: ["INBOX"] }
    ]
  },
  trash_message: {
    id: "18b9f2a3c1d4e5f6",
    threadId: "18b9f2a3c1d4e5f6",
    labelIds: ["TRASH"]
  },
  untrash_message: {
    id: "18b9f2a3c1d4e5f6",
    threadId: "18b9f2a3c1d4e5f6",
    labelIds: ["INBOX"]
  },
  mark_thread_read: {
    id: "18b9f2a3c1d4e5f6",
    historyId: "3456795",
    messages: [
      { id: "18b9f2a3c1d4e5f6", threadId: "18b9f2a3c1d4e5f6", labelIds: ["INBOX"] }
    ]
  },
  mark_thread_unread: {
    id: "18b9f2a3c1d4e5f6",
    historyId: "3456796",
    messages: [
      { id: "18b9f2a3c1d4e5f6", threadId: "18b9f2a3c1d4e5f6", labelIds: ["INBOX", "UNREAD"] }
    ]
  },
  add_label_to_thread: {
    id: "18b9f2a3c1d4e5f6",
    historyId: "3456797",
    messages: [
      { id: "18b9f2a3c1d4e5f6", threadId: "18b9f2a3c1d4e5f6", labelIds: ["INBOX", "Label_12345678"] }
    ]
  },
  remove_label_from_thread: {
    id: "18b9f2a3c1d4e5f6",
    historyId: "3456798",
    messages: [
      { id: "18b9f2a3c1d4e5f6", threadId: "18b9f2a3c1d4e5f6", labelIds: ["INBOX"] }
    ]
  },
  get_attachment: {
    size: 204800,
    data: "JVBERi0xLjQKJcOkw7zDtsO...",
    attachmentId: "ANGjdJ9Qk1xQa2mF8vXs3pL..."
  },
  create_alias: {
    sendAsEmail: "reports@company.com",
    displayName: "Reports Team",
    replyToAddress: "",
    isPrimary: false,
    isDefault: false,
    verificationStatus: "accepted",
    treatAsAlias: true
  },
  list_smime_certificates: {
    smimeInfo: [
      {
        id: "smime_cert_001",
        issuerCn: "DigiCert SHA2 Assured ID CA",
        isDefault: true,
        expiration: "1780000000000",
        encryptedKeyPassword: ""
      }
    ]
  },
  add_smime_certificate: {
    id: "smime_cert_002",
    issuerCn: "DigiCert SHA2 Assured ID CA",
    isDefault: false,
    expiration: "1780000000000",
    encryptedKeyPassword: ""
  },
};


let idCounter = 1;

function buildFnSchema(fn) {
  const props = {};
  for (const [k, v] of Object.entries(fn.parameters)) {
    const isEnum = v.type.startsWith('enum:');
    if (isEnum) {
      props[k] = {
        type: "string",
        enum: v.type.replace('enum:', '').trim().split('|').map(s => s.trim()),
        description: v.description,
      };
    } else if (v.type.startsWith('array')) {
      props[k] = { type: "array", items: { type: "string" }, description: v.description };
    } else {
      props[k] = { type: v.type, description: v.description };
    }
  }
  return { type: "object", properties: props, required: fn.required };
}

function JsonHighlight({ json }) {
  const tokens = [];
  const re = /("(?:\\.|[^"\\])*")(\s*:)?|(\btrue\b|\bfalse\b|\bnull\b)|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|([{}[\],])/g;
  let last = 0, m;
  while ((m = re.exec(json)) !== null) {
    if (m.index > last) tokens.push({ t: 'plain', v: json.slice(last, m.index) });
    if (m[1] !== undefined) {
      if (m[2]) { tokens.push({ t: 'key', v: m[1] }); tokens.push({ t: 'plain', v: m[2] }); }
      else tokens.push({ t: 'str', v: m[1] });
    } else if (m[3]) tokens.push({ t: 'kw', v: m[3] });
    else if (m[4]) tokens.push({ t: 'num', v: m[4] });
    else if (m[5]) tokens.push({ t: 'punct', v: m[5] });
    last = m.index + m[0].length;
  }
  if (last < json.length) tokens.push({ t: 'plain', v: json.slice(last) });
  const colors = { key: '#79c0ff', str: '#a5d6ff', kw: '#569cd6', num: '#b5cea8', punct: '#6e7681', plain: '#8b949e' };
  return <>{tokens.map((tok, i) => <span key={i} style={{ color: colors[tok.t] }}>{tok.v}</span>)}</>;
}

export default function FunctionCallTrainer() {
  const [queryIndex, setQueryIndex] = useState(0);
  const [expandedFns, setExpandedFns] = useState(new Set());
  const [calls, setCalls] = useState([{ id: idCounter++, fnName: 'None', payload: '{}' }]);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  const query = SAMPLE_QUERIES[queryIndex];

  const toggleFn = (name) => {
    setExpandedFns(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const addCall = () => {
    setCalls(prev => [...prev, { id: idCounter++, fnName: 'None', payload: '{}' }]);
    setSubmitted(false);
  };

  const removeCall = (id) => {
    setCalls(prev => prev.filter(c => c.id !== id));
    setSubmitted(false);
  };

  const updateCall = (id, field, value) => {
    setCalls(prev => prev.map(c => {
      if (c.id !== id) return c;
      if (field === 'fnName') {
        const fn = FUNCTIONS.find(f => f.name === value);
        const scaffold = fn
          ? JSON.stringify(Object.fromEntries(fn.required.map(k => [k, ''])), null, 2)
          : '';
        return { ...c, fnName: value, payload: scaffold };
      }
      return { ...c, [field]: value };
    }));
    setSubmitted(false);
    setErrors(prev => ({ ...prev, [id]: null }));
  };

  const handleSubmit = () => {
    const newErrors = {};
    let valid = true;
    for (const call of calls) {
      if (call.fnName === 'None') continue;
      try {
        const parsed = JSON.parse(call.payload);
        const fn = FUNCTIONS.find(f => f.name === call.fnName);
        if (fn) {
          for (const req of fn.required) {
            if (!(req in parsed) || parsed[req] === '' || parsed[req] === null) {
              newErrors[call.id] = `Missing required field: "${req}"`;
              valid = false;
            }
          }
        }
      } catch {
        newErrors[call.id] = 'Invalid JSON — check your payload syntax.';
        valid = false;
      }
    }
    setErrors(newErrors);
    setSubmitted(valid && Object.keys(newErrors).length === 0);
  };

  const nextQuery = () => {
    setQueryIndex(i => (i + 1) % SAMPLE_QUERIES.length);
    setCalls([{ id: idCounter++, fnName: 'None', payload: '' }]);
    setSubmitted(false);
    setErrors({});
  };

  const prevQuery = () => {
    setQueryIndex(i => (i - 1 + SAMPLE_QUERIES.length) % SAMPLE_QUERIES.length);
    setCalls([{ id: idCounter++, fnName: 'None', payload: '' }]);
    setSubmitted(false);
    setErrors({});
  };

  return (
    <div style={{
      fontFamily: "'Berkeley Mono', 'Fira Code', 'Cascadia Code', monospace",
      background: '#0d1117',
      minHeight: '100vh',
      color: '#c9d1d9',
      padding: '0',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600&family=Syne:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #161b22; }
        ::-webkit-scrollbar-thumb { background: #30363d; border-radius: 3px; }

        .header-band {
          background: #010409;
          border-bottom: 1px solid #21262d;
          padding: 18px 32px;
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .logo-chip {
          background: #1f6feb;
          color: #fff;
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 4px 10px;
          border-radius: 4px;
        }
        .header-title {
          font-family: 'Syne', sans-serif;
          font-size: 15px;
          font-weight: 700;
          color: #e6edf3;
          letter-spacing: 0.02em;
        }
        .header-sub {
          font-size: 11px;
          color: #6e7681;
          margin-left: auto;
          font-family: 'JetBrains Mono', monospace;
        }

        .main { max-width: 1100px; margin: 0 auto; padding: 32px 24px; }

        /* Query card */
        .query-card {
          background: #161b22;
          border: 1px solid #21262d;
          border-radius: 8px;
          padding: 24px 28px;
          margin-bottom: 28px;
          position: relative;
        }
        .query-label {
          font-family: 'Syne', sans-serif;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #6e7681;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .query-counter {
          background: #21262d;
          color: #8b949e;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          font-weight: 400;
          letter-spacing: 0.05em;
          text-transform: none;
          padding: 2px 8px;
          border-radius: 10px;
        }
        .query-text {
          font-family: 'Syne', sans-serif;
          font-size: 20px;
          font-weight: 600;
          color: #e6edf3;
          line-height: 1.5;
        }
        .query-hint {
          background: #1f6feb22;
          color: #79c0ff;
          border: 1px solid #1f6feb55;
          padding: 1px 6px;
          border-radius: 4px;
          font-size: 19px;
        }
        .query-nav {
          position: absolute;
          top: 20px;
          right: 20px;
          display: flex;
          gap: 6px;
          align-items: center;
        }
        .nav-btn {
          background: #21262d;
          border: 1px solid #30363d;
          color: #8b949e;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          padding: 6px 12px;
          border-radius: 5px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .nav-btn:hover { background: #30363d; color: #c9d1d9; }
        .query-counter {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: #6e7681;
          padding: 0 4px;
        }

        /* Section headers */
        .section-header {
          font-family: 'Syne', sans-serif;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #6e7681;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid #21262d;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .fn-count {
          background: #21262d;
          color: #8b949e;
          font-size: 10px;
          padding: 2px 7px;
          border-radius: 10px;
        }

        /* Function toggles */
        .fn-list { display: flex; flex-direction: column; gap: 4px; margin-bottom: 28px; }
        .fn-toggle {
          background: #161b22;
          border: 1px solid #21262d;
          border-radius: 6px;
          overflow: hidden;
          transition: border-color 0.15s;
        }
        .fn-toggle.open { border-color: #30363d; }
        .fn-toggle-header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          cursor: pointer;
          user-select: none;
          transition: background 0.1s;
        }
        .fn-toggle-header:hover { background: #1c2128; }
        .fn-caret {
          color: #6e7681;
          font-size: 10px;
          transition: transform 0.2s;
          width: 12px;
        }
        .fn-caret.open { transform: rotate(90deg); color: #58a6ff; }
        .fn-name {
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          font-weight: 500;
          color: #dcdcaa;
          flex: 1;
        }
        .fn-desc-inline {
          font-size: 11px;
          color: #6e7681;
          font-family: 'JetBrains Mono', monospace;
          max-width: 480px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .req-badge {
          background: #2d1e1e;
          color: #ff7b72;
          font-size: 9px;
          font-family: 'JetBrains Mono', monospace;
          padding: 2px 7px;
          border-radius: 3px;
          border: 1px solid #3d2020;
          white-space: nowrap;
        }
        .fn-body {
          padding: 0 14px 14px;
          border-top: 1px solid #21262d;
        }
        .fn-desc {
          font-size: 12px;
          color: #8b949e;
          font-family: 'JetBrains Mono', monospace;
          padding: 10px 0 12px;
          border-bottom: 1px solid #21262d;
          margin-bottom: 12px;
        }
        .json-block {
          background: #0d1117;
          border: 1px solid #21262d;
          border-radius: 5px;
          padding: 12px 14px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11.5px;
          line-height: 1.7;
          overflow-x: auto;
          white-space: pre;
          margin: 0;
        }
        .output-section {
          margin-top: 12px;
          border-top: 1px solid #21262d;
          padding-top: 10px;
        }
        .output-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9.5px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #3fb950;
          margin-bottom: 6px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .output-label::before {
          content: "";
          display: inline-block;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #3fb950;
          flex-shrink: 0;
        }
        .json-block.output {
          border-color: #1a3d2b;
          background: #020d07;
        }

        /* Call builder */
        .call-builder { display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px; }
        .call-card {
          background: #161b22;
          border: 1px solid #21262d;
          border-radius: 8px;
          overflow: hidden;
        }
        .call-card.has-error { border-color: #ff7b7244; }
        .call-card-header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          background: #0d1117;
          border-bottom: 1px solid #21262d;
        }
        .call-index {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 11px;
          color: #6e7681;
          background: #21262d;
          width: 22px;
          height: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          flex-shrink: 0;
        }
        .fn-select {
          flex: 1;
          background: #21262d;
          border: 1px solid #30363d;
          color: #c9d1d9;
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          padding: 6px 10px;
          border-radius: 5px;
          outline: none;
          cursor: pointer;
          transition: border-color 0.15s;
        }
        .fn-select:focus { border-color: #1f6feb; }
        .fn-select option { background: #21262d; }
        .remove-btn {
          background: none;
          border: 1px solid #30363d;
          color: #6e7681;
          font-size: 14px;
          width: 28px;
          height: 28px;
          border-radius: 5px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
          flex-shrink: 0;
        }
        .remove-btn:hover { background: #3d2020; border-color: #ff7b72; color: #ff7b72; }
        .call-body { padding: 12px 14px; }
        .payload-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: #6e7681;
          margin-bottom: 6px;
          letter-spacing: 0.08em;
        }
        .payload-area {
          width: 100%;
          background: #0d1117;
          border: 1px solid #30363d;
          color: #c9d1d9;
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          padding: 10px 12px;
          border-radius: 5px;
          resize: vertical;
          min-height: 90px;
          outline: none;
          line-height: 1.6;
          transition: border-color 0.15s;
        }
        .payload-area:focus { border-color: #1f6feb; }
        .payload-area.error { border-color: #ff7b72; }
        .payload-na {
          width: 100%;
          background: #0d1117;
          border: 1px dashed #30363d;
          color: #3d444d;
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          font-weight: 600;
          padding: 18px 12px;
          border-radius: 5px;
          letter-spacing: 0.1em;
          text-align: center;
        }
        .error-msg {
          margin-top: 6px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: #ff7b72;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .add-btn {
          background: #161b22;
          border: 1px dashed #30363d;
          color: #8b949e;
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          padding: 10px;
          border-radius: 6px;
          cursor: pointer;
          width: 100%;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .add-btn:hover { background: #1c2128; border-color: #58a6ff; color: #58a6ff; }

        .submit-row {
          display: flex;
          gap: 10px;
          align-items: center;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #21262d;
        }
        .submit-btn {
          background: #1f6feb;
          border: none;
          color: #fff;
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 700;
          padding: 10px 24px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s;
          letter-spacing: 0.04em;
        }
        .submit-btn:hover { background: #388bfd; }
        .success-pill {
          background: #1a3d2b;
          color: #3fb950;
          border: 1px solid #2ea043;
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          padding: 8px 14px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          gap: 6px;
          animation: fadeIn 0.3s ease;
        }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }

        .two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          align-items: start;
        }
        @media (max-width: 780px) { .two-col { grid-template-columns: 1fr; } }
      `}</style>

      {/* Header */}
      <div className="header-band">
        <div className="logo-chip">LLM</div>
        <div className="header-title">Function Call Trainer</div>
        <div className="header-sub">gmail schema · {FUNCTIONS.length} functions</div>
      </div>

      <div className="main">
        {/* Query */}
        <div className="query-card">
          <div className="query-label">↳ User Query <span className="query-counter">{queryIndex + 1} / {SAMPLE_QUERIES.length}</span></div>
          <div className="query-text">
            {query.text.split(new RegExp(`(\\{${query.hint.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\})`, 'g')).map((part, i) =>
              part === `{${query.hint}}`
                ? <span key={i} className="query-hint">{query.hint}</span>
                : part
            )}
          </div>
          <div className="query-nav"><button className="nav-btn" onClick={prevQuery}>← Prev</button><button className="nav-btn" onClick={nextQuery}>Next →</button></div>
        </div>

        <div className="two-col">
          {/* Left: Schema Reference */}
          <div>
            <div className="section-header">
              Schema Reference
              <span className="fn-count">{FUNCTIONS.length} functions</span>
              <span style={{ marginLeft: 'auto', fontSize: 10, color: '#6e7681', fontFamily: 'JetBrains Mono' }}>
                click to expand
              </span>
            </div>
            <div className="fn-list">
              {FUNCTIONS.map(fn => {
                const isOpen = expandedFns.has(fn.name);
                return (
                  <div key={fn.name} className={`fn-toggle ${isOpen ? 'open' : ''}`}>
                    <div className="fn-toggle-header" onClick={() => toggleFn(fn.name)}>
                      <span className={`fn-caret ${isOpen ? 'open' : ''}`}>▶</span>
                      <span className="fn-name">{fn.name}</span>
                      {!isOpen && <span className="fn-desc-inline">{fn.description}</span>}
                      {fn.required.length > 0 && (
                        <span className="req-badge">{fn.required.length} req</span>
                      )}
                    </div>
                    {isOpen && (
                      <div className="fn-body">
                        <div className="fn-desc">{fn.description}</div>
                        <pre className="json-block"><JsonHighlight json={buildFnSchema(fn) ? JSON.stringify(buildFnSchema(fn), null, 2) : '{}'} /></pre>
                        {FUNCTION_OUTPUTS[fn.name] && (
                          <div className="output-section">
                            <div className="output-label">Sample Output</div>
                            <pre className="json-block output"><JsonHighlight json={JSON.stringify(FUNCTION_OUTPUTS[fn.name], null, 2)} /></pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Answer Builder */}
          <div>
            <div className="section-header">
              Your Answer
              <span className="fn-count">{calls.filter(c => c.fnName !== 'None').length} call{calls.filter(c => c.fnName !== 'None').length !== 1 ? 's' : ''}</span>
            </div>

            <div className="call-builder">
              {calls.map((call, i) => {
                const err = errors[call.id];
                return (
                  <div key={call.id} className={`call-card ${err ? 'has-error' : ''}`}>
                    <div className="call-card-header">
                      <div className="call-index">{i + 1}</div>
                      <select
                        className="fn-select"
                        value={call.fnName}
                        onChange={e => updateCall(call.id, 'fnName', e.target.value)}
                      >
                        <option value="None">— None —</option>
                        {FUNCTIONS.map(fn => (
                          <option key={fn.name} value={fn.name}>{fn.name}</option>
                        ))}
                      </select>
                      {calls.length > 1 && (
                        <button className="remove-btn" onClick={() => removeCall(call.id)}>×</button>
                      )}
                    </div>
                    <div className="call-body">
                      <div className="payload-label">PAYLOAD (JSON)</div>
                      <textarea
                        className={`payload-area ${err ? 'error' : ''}`}
                        value={call.payload}
                        onChange={e => updateCall(call.id, 'payload', e.target.value)}
                        spellCheck={false}
                        rows={Math.max(4, call.payload.split('\n').length + 1)}
                        placeholder={call.fnName === 'None' ? 'N/A' : ''}
                      />
                      {err && <div className="error-msg">⚠ {err}</div>}
                    </div>
                  </div>
                );
              })}
            </div>

            <button className="add-btn" onClick={addCall}>
              + Add another function call
            </button>

            <div className="submit-row">
              <button className="submit-btn" onClick={handleSubmit}>
                Submit Answer
              </button>
              {submitted && (
                <div className="success-pill">
                  ✓ Valid — {calls.filter(c => c.fnName !== 'None').length} call{calls.filter(c => c.fnName !== 'None').length !== 1 ? 's' : ''} recorded
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};