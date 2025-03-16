
import { Card } from "@/components/ui/card";
import { Change } from "@/types";

interface ChangeIndexProps {
  changes: Change[];
  className?: string;
}

const ChangeIndex = ({ changes, className = "" }: ChangeIndexProps) => {
  if (!changes.length) {
    return (
      <Card className={`p-6 ${className}`}>
        <h2 className="text-xl font-semibold mb-4">Index of changes</h2>
        <p className="text-muted-foreground">No changes have been recorded for this bill.</p>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${className}`}>
      <h2 className="text-xl font-semibold mb-4">Index of changes</h2>
      <ol className="list-decimal pl-6 space-y-2">
        {changes.map((change) => (
          <li key={change.id} className="text-gray-700">
            {change.description}
          </li>
        ))}
      </ol>
    </Card>
  );
};

export default ChangeIndex;
