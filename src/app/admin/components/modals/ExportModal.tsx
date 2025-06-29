'use client';

import { useCallback, useMemo, useState } from 'react';
import './ExportModal.css';

interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  created_at: string;
  provider_name?: string | null;
  is_timed_out?: boolean;
  active_timeout_id?: number | null;
  active_timeout_reason?: string | null;
  timeout_expires?: string | null;
  role_names?: string | null;
  has_admin?: boolean;
  has_moderator?: boolean;
  subscriptions?: Array<{
    id: string;
    service_name: string;
    plan_name: string;
    status: string;
    expires_at: string | null;
  }>;
}

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  selectedUser?: User | null;
}

type ExportFormat = 'csv' | 'html' | 'markdown' | 'json';
type ExportScope = 'all' | 'current' | 'selected';

const EXPORT_FORMATS = [
  {
    value: 'csv' as const,
    label: 'CSV',
    description: 'Comma-separated values for spreadsheets',
    icon: '📊'
  },
  {
    value: 'html' as const,
    label: 'HTML Table',
    description: 'Rich HTML table with styling',
    icon: '🌐'
  },
  {
    value: 'markdown' as const,
    label: 'Markdown',
    description: 'Markdown table format',
    icon: '📝'
  },
  {
    value: 'json' as const,
    label: 'JSON',
    description: 'Structured JSON data',
    icon: '🔧'
  }
];

const EXPORT_SCOPES = [
  {
    value: 'all' as const,
    label: 'All Users',
    description: 'Export all users in the system'
  },
  {
    value: 'current' as const,
    label: 'Current Page',
    description: 'Export only users on current page'
  },
  {
    value: 'selected' as const,
    label: 'Selected User',
    description: 'Export only the selected user'
  }
];

const DATA_FIELDS = [
  { key: 'id', label: 'User ID', default: true },
  { key: 'name', label: 'Name', default: true },
  { key: 'email', label: 'Email', default: true },
  { key: 'provider_name', label: 'Provider', default: true },
  { key: 'role_names', label: 'Roles', default: true },
  { key: 'is_timed_out', label: 'Timeout Status', default: true },
  { key: 'active_timeout_reason', label: 'Timeout Reason', default: false },
  { key: 'timeout_expires', label: 'Timeout Expires', default: false },
  { key: 'created_at', label: 'Join Date', default: true },
  { key: 'has_admin', label: 'Is Admin', default: false },
  { key: 'has_moderator', label: 'Is Moderator', default: false },
  { key: 'subscriptions', label: 'Subscriptions', default: false }
];

export function ExportModal({
  isOpen,
  onClose,
  users,
  selectedUser
}: ExportModalProps) {
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [scope, setScope] = useState<ExportScope>('current');
  const [selectedFields, setSelectedFields] = useState<string[]>(
    DATA_FIELDS.filter((field) => field.default).map((field) => field.key)
  );
  const [isExporting, setIsExporting] = useState(false);
  const [exportPreview, setExportPreview] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);

  const exportData = useMemo(() => {
    switch (scope) {
      case 'all':
        return users; // In real implementation, this would fetch all users
      case 'current':
        return users;
      case 'selected':
        return selectedUser ? [selectedUser] : [];
      default:
        return users;
    }
  }, [scope, users, selectedUser]);

  const filteredData = useMemo(() => {
    return exportData.map((user) => {
      const filtered: any = {};
      selectedFields.forEach((field) => {
        switch (field) {
          case 'subscriptions':
            filtered[field] =
              user.subscriptions
                ?.map((sub) => `${sub.plan_name} (${sub.status})`)
                .join('; ') || 'None';
            break;
          case 'is_timed_out':
            filtered[field] = user.is_timed_out ? 'Yes' : 'No';
            break;
          case 'created_at':
          case 'timeout_expires':
            filtered[field] = user[field]
              ? new Date(user[field]!).toLocaleString()
              : '';
            break;
          default:
            filtered[field] = user[field as keyof User] || '';
        }
      });
      return filtered;
    });
  }, [exportData, selectedFields]);

  const generateExport = useCallback((format: ExportFormat, data: any[]) => {
    switch (format) {
      case 'csv':
        return generateCSV(data);
      case 'html':
        return generateHTML(data);
      case 'markdown':
        return generateMarkdown(data);
      case 'json':
        return generateJSON(data);
      default:
        return '';
    }
  }, []);

  const generateCSV = (data: any[]) => {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    const csvRows = data.map((row) =>
      headers
        .map((header) => {
          const value = row[header]?.toString() || '';
          // Escape quotes and wrap in quotes if contains comma or quote
          if (
            value.includes(',') ||
            value.includes('"') ||
            value.includes('\n')
          ) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(',')
    );

    return [csvHeaders, ...csvRows].join('\n');
  };

  const generateHTML = (data: any[]) => {
    if (data.length === 0) return '<p>No data to export</p>';

    const headers = Object.keys(data[0]);
    const headerRow = headers
      .map(
        (header) =>
          `<th>${DATA_FIELDS.find((f) => f.key === header)?.label || header}</th>`
      )
      .join('');

    const dataRows = data
      .map(
        (row) =>
          `<tr>${headers.map((header) => `<td>${row[header] || ''}</td>`).join('')}</tr>`
      )
      .join('');

    return `
<!DOCTYPE html>
<html>
<head>
    <title>User Export - ${new Date().toLocaleDateString()}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 20px; }
        table { border-collapse: collapse; width: 100%; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #f5f5f5; font-weight: 600; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .export-info { color: #666; margin-bottom: 20px; }
    </style>
</head>
<body>
    <h1>User Data Export</h1>
    <div class="export-info">
        <p>Generated on: ${new Date().toLocaleString()}</p>
        <p>Total records: ${data.length}</p>
        <p>Export scope: ${EXPORT_SCOPES.find((s) => s.value === scope)?.label}</p>
    </div>
    <table>
        <thead><tr>${headerRow}</tr></thead>
        <tbody>${dataRows}</tbody>
    </table>
</body>
</html>`;
  };

  const generateMarkdown = (data: any[]) => {
    if (data.length === 0) return 'No data to export';

    const headers = Object.keys(data[0]);
    const headerLabels = headers.map(
      (header) => DATA_FIELDS.find((f) => f.key === header)?.label || header
    );

    const headerRow = `| ${headerLabels.join(' | ')} |`;
    const separatorRow = `| ${headers.map(() => '---').join(' | ')} |`;
    const dataRows = data.map(
      (row) =>
        `| ${headers.map((header) => (row[header] || '').toString().replace(/\|/g, '\\|')).join(' | ')} |`
    );

    return [
      `# User Data Export`,
      ``,
      `**Generated:** ${new Date().toLocaleString()}  `,
      `**Records:** ${data.length}  `,
      `**Scope:** ${EXPORT_SCOPES.find((s) => s.value === scope)?.label}  `,
      ``,
      headerRow,
      separatorRow,
      ...dataRows
    ].join('\n');
  };

  const generateJSON = (data: any[]) => {
    return JSON.stringify(
      {
        exportInfo: {
          generatedAt: new Date().toISOString(),
          totalRecords: data.length,
          exportScope: scope,
          selectedFields: selectedFields
        },
        data: data
      },
      null,
      2
    );
  };

  const handlePreview = useCallback(() => {
    const preview = generateExport(format, filteredData.slice(0, 5)); // Preview first 5 rows
    setExportPreview(preview);
    setShowPreview(true);
  }, [format, filteredData, generateExport]);

  const handleExport = useCallback(async () => {
    setIsExporting(true);

    try {
      const content = generateExport(format, filteredData);
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `users-export-${timestamp}.${format === 'html' ? 'html' : format}`;

      // Create and download file
      const blob = new Blob([content], {
        type:
          format === 'csv'
            ? 'text/csv'
            : format === 'html'
              ? 'text/html'
              : format === 'json'
                ? 'application/json'
                : 'text/plain'
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Close modal after successful export
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  }, [format, filteredData, generateExport, onClose]);

  const handleFieldToggle = useCallback((fieldKey: string) => {
    setSelectedFields((prev) =>
      prev.includes(fieldKey)
        ? prev.filter((f) => f !== fieldKey)
        : [...prev, fieldKey]
    );
  }, []);

  const handleSelectAllFields = useCallback(() => {
    setSelectedFields(DATA_FIELDS.map((f) => f.key));
  }, []);

  const handleSelectDefaultFields = useCallback(() => {
    setSelectedFields(DATA_FIELDS.filter((f) => f.default).map((f) => f.key));
  }, []);

  if (!isOpen) return null;

  return (
    <div className="export-modal-overlay" onClick={onClose}>
      <div className="export-modal" onClick={(e) => e.stopPropagation()}>
        <div className="export-modal__header">
          <h2 className="export-modal__title">Export User Data</h2>
          <button
            type="button"
            className="export-modal__close"
            onClick={onClose}
            disabled={isExporting}
          >
            ✕
          </button>
        </div>

        <div className="export-modal__content">
          {/* Export Format Selection */}
          <div className="export-modal__section">
            <h3 className="export-modal__section-title">Export Format</h3>
            <div className="export-format-grid">
              {EXPORT_FORMATS.map((fmt) => (
                <label key={fmt.value} className="export-format-option">
                  <input
                    type="radio"
                    name="format"
                    value={fmt.value}
                    checked={format === fmt.value}
                    onChange={(e) => setFormat(e.target.value as ExportFormat)}
                    disabled={isExporting}
                  />
                  <div className="export-format-content">
                    <div className="export-format-header">
                      <span className="export-format-icon">{fmt.icon}</span>
                      <span className="export-format-label">{fmt.label}</span>
                    </div>
                    <span className="export-format-description">
                      {fmt.description}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Export Scope Selection */}
          <div className="export-modal__section">
            <h3 className="export-modal__section-title">Export Scope</h3>
            <div className="export-scope-options">
              {EXPORT_SCOPES.map((scopeOption) => (
                <label key={scopeOption.value} className="export-scope-option">
                  <input
                    type="radio"
                    name="scope"
                    value={scopeOption.value}
                    checked={scope === scopeOption.value}
                    onChange={(e) => setScope(e.target.value as ExportScope)}
                    disabled={
                      isExporting ||
                      (scopeOption.value === 'selected' && !selectedUser)
                    }
                  />
                  <div className="export-scope-content">
                    <span className="export-scope-label">
                      {scopeOption.label}
                    </span>
                    <span className="export-scope-description">
                      {scopeOption.description}
                    </span>
                    {scopeOption.value === 'current' && (
                      <span className="export-scope-count">
                        ({users.length} users)
                      </span>
                    )}
                    {scopeOption.value === 'selected' && selectedUser && (
                      <span className="export-scope-count">(1 user)</span>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Field Selection */}
          <div className="export-modal__section">
            <div className="export-fields-header">
              <h3 className="export-modal__section-title">Select Fields</h3>
              <div className="export-fields-actions">
                <button
                  type="button"
                  className="export-fields-action"
                  onClick={handleSelectAllFields}
                  disabled={isExporting}
                >
                  Select All
                </button>
                <button
                  type="button"
                  className="export-fields-action"
                  onClick={handleSelectDefaultFields}
                  disabled={isExporting}
                >
                  Default Fields
                </button>
              </div>
            </div>
            <div className="export-fields-grid">
              {DATA_FIELDS.map((field) => (
                <label key={field.key} className="export-field-option">
                  <input
                    type="checkbox"
                    checked={selectedFields.includes(field.key)}
                    onChange={() => handleFieldToggle(field.key)}
                    disabled={isExporting}
                  />
                  <span className="export-field-label">{field.label}</span>
                  {field.default && (
                    <span className="export-field-default">Default</span>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Export Info */}
          <div className="export-modal__info">
            <div className="export-info-item">
              <strong>Records to export:</strong> {filteredData.length}
            </div>
            <div className="export-info-item">
              <strong>Selected fields:</strong> {selectedFields.length}
            </div>
          </div>
        </div>

        <div className="export-modal__actions">
          <button
            type="button"
            onClick={handlePreview}
            className="export-modal__preview"
            disabled={isExporting || selectedFields.length === 0}
          >
            Preview
          </button>
          <button
            type="button"
            onClick={onClose}
            className="export-modal__cancel"
            disabled={isExporting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="export-modal__export"
            disabled={
              isExporting ||
              selectedFields.length === 0 ||
              filteredData.length === 0
            }
          >
            {isExporting ? 'Exporting...' : `Export ${format.toUpperCase()}`}
          </button>
        </div>

        {/* Preview Modal */}
        {showPreview && (
          <div
            className="export-preview-overlay"
            onClick={() => setShowPreview(false)}
          >
            <div
              className="export-preview-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="export-preview-header">
                <h3>Export Preview ({format.toUpperCase()})</h3>
                <button onClick={() => setShowPreview(false)}>✕</button>
              </div>
              <div className="export-preview-content">
                <pre>{exportPreview}</pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
