export type PayrollLeaveFilterProps = {
  cycleStatus?: string;
  leaveStatus?: string;
};

export function PayrollLeaveFilterInputs({
  cycleStatus,
  leaveStatus,
}: PayrollLeaveFilterProps) {
  return (
    <>
      {cycleStatus ? <input name="cycleStatus" type="hidden" value={cycleStatus} /> : null}
      {leaveStatus ? <input name="leaveStatus" type="hidden" value={leaveStatus} /> : null}
    </>
  );
}
