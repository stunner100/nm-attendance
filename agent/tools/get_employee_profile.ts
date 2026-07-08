import { defineTool } from "eve/tools";
import { z } from "zod";

import { getEmployeePerformanceProfile } from "@/lib/hr/employee-profile";

export default defineTool({
  description:
    "Get a 360-degree performance profile for one employee: scores, KPIs, tasks, attendance, rewards, accountability, PIP, growth plan, and training.",
  inputSchema: z.object({
    employeeId: z.number().int().positive().describe("HR employee id."),
  }),
  async execute({ employeeId }) {
    const profile = await getEmployeePerformanceProfile(employeeId);
    if (!profile) {
      return {
        found: false,
        employeeId,
        message: "No employee found with that id.",
      };
    }

    return {
      found: true,
      href: `/admin/headcount/${employeeId}`,
      employee: {
        id: profile.employee.id,
        fullName: profile.employee.full_name,
        department: profile.employee.department,
        jobTitle: profile.employee.job_title,
        managerName: profile.managerName,
        employmentStatus: profile.employee.employment_status,
      },
      currentScore: profile.currentScore,
      scoreTrend: profile.scoreTrend,
      attendanceSummary: profile.attendanceSummary,
      openTasks: profile.tasks
        .filter((task) => task.status !== "completed")
        .slice(0, 10)
        .map((task) => ({
          id: task.id,
          title: task.title,
          status: task.status,
          dueOn: task.due_date,
          href: "/admin/tasks",
        })),
      kpiCardCount: profile.kpiCards.length,
      rewardsCount: profile.rewards.length,
      openAccountability: profile.accountability
        .filter((item) => item.status !== "resolved")
        .slice(0, 5),
      activePip: profile.activePip,
      growthPlan: profile.growthPlan
        ? {
            id: profile.growthPlan.id,
            status: profile.growthPlan.status,
            href: "/admin/growth",
          }
        : null,
      trainingAssignments: profile.training.slice(0, 5),
    };
  },
});
