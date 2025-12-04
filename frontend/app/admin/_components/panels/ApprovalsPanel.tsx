import CardDense from "@/components/ui/cards/CardDense";
import {Button} from "@/components/ui/button";
import {User} from "@/lib/types";

interface ApprovalsPanelProps {
  pendingUsers: User[];
  disableAction: boolean;
  onApprove: (user: User) => void;
  onReject: (user: User) => void;
}

export default function ApprovalsPanel({
  pendingUsers,
  disableAction,
  onApprove,
  onReject,
}: ApprovalsPanelProps) {
  return (
    <CardDense>
      <h2 className="text-lg font-semibold mb-4">Pending Users</h2>
      {pendingUsers.length === 0 ? (
        <p className="text-sm text-muted-foreground">No pending users.</p>
      ) : (
        <div className="space-y-3">
          {pendingUsers.map((user) => (
            <div
              key={user.id}
              className="flex flex-col rounded-xl border border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-semibold">{user.name}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
                <p className="text-xs text-gray-400">{user.githubUsername}</p>
              </div>
              <div className="mt-3 flex gap-2 sm:mt-0">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => onReject(user)}
                  disabled={disableAction}
                >
                  Reject
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => onApprove(user)}
                  disabled={disableAction}
                >
                  Approve
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </CardDense>
  );
}
