import { JobCustomField } from "@/lib/jobFields";

type FieldValue = string | number | boolean | undefined;

interface Props {
  field: JobCustomField;
  value: FieldValue;
  onChange: (v: FieldValue) => void;
}

const inputCls = "w-full h-9 rounded-md border-hairline bg-background px-2 text-sm";

export default function JobFieldInput({ field, value, onChange }: Props) {
  switch (field.type) {
    case "textarea":
      return (
        <textarea
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={3}
          className="w-full rounded-md border-hairline bg-background px-2 py-1.5 text-sm resize-none"
        />
      );
    case "select":
      return (
        <select
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={inputCls}
        >
          <option value="">—</option>
          {field.options?.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      );
    case "checkbox":
      return (
        <label className="inline-flex items-center gap-2 h-9 text-sm">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
            className="h-4 w-4 rounded border-hairline"
          />
          <span className="text-muted-foreground">{field.placeholder || "Yes"}</span>
        </label>
      );
    case "number":
      return (
        <input
          type="number"
          value={(value as number | string) ?? ""}
          onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
          placeholder={field.placeholder}
          className={inputCls}
        />
      );
    case "date":
      return (
        <input
          type="date"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={inputCls}
        />
      );
    case "email":
    case "phone":
    case "text":
    default:
      return (
        <input
          type={field.type === "email" ? "email" : field.type === "phone" ? "tel" : "text"}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={inputCls}
        />
      );
  }
}
