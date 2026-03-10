import { AdminPageHeader } from "@/components/admin-page-header";
import {
  adminActivity,
  adminMetricCards,
  adminQuickStats,
  adminTasks,
} from "@/lib/site-data";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Dashboard"
        description="Overview of association performance, pending requests, and operational activity."
      />

      <section className="grid gap-4 xl:grid-cols-4">
        {adminMetricCards.map((card) => (
          <article
            key={card.label}
            className="admin-card overflow-hidden rounded-[1.2rem]"
          >
            <div className={`h-2 w-full ${card.barClass}`} />
            <div className="p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                {card.label}
              </p>
              <div className="mt-3 flex items-end justify-between gap-4">
                <p className="text-3xl font-bold text-slate-800">{card.value}</p>
                <span className={`admin-badge ${card.badgeClass}`}>{card.delta}</span>
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-500">
                {card.description}
              </p>
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <article className="admin-card rounded-[1.2rem] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                Monthly Activity
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-800">
                Member service requests
              </h2>
            </div>
            <span className="admin-badge">Updated today</span>
          </div>
          <div className="mt-8 grid grid-cols-6 gap-4">
            {adminQuickStats.map((item) => (
              <div key={item.month} className="text-center">
                <div className="flex h-52 items-end justify-center rounded-[1rem] bg-slate-50 px-4">
                  <div
                    className={`w-full rounded-t-[0.9rem] ${item.color}`}
                    style={{ height: `${item.value}%` }}
                  />
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-700">
                  {item.month}
                </p>
              </div>
            ))}
          </div>
        </article>

        <article className="admin-card rounded-[1.2rem] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Today’s Focus
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-800">
            Operational checklist
          </h2>
          <div className="mt-6 space-y-4">
            {adminTasks.map((task) => (
              <div
                key={task.title}
                className="rounded-[1rem] border border-slate-200 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-800">{task.title}</p>
                  <span className="admin-badge">{task.status}</span>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-500">
                  {task.description}
                </p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="admin-card rounded-[1.2rem] p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              Recent Activity
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-800">
              Association workflow log
            </h2>
          </div>
          <span className="admin-badge">AdminLTE-style data panel</span>
        </div>
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-3">
            <thead>
              <tr className="text-left text-sm font-semibold text-slate-500">
                <th className="pb-2">Time</th>
                <th className="pb-2">Action</th>
                <th className="pb-2">Owner</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {adminActivity.map((item) => (
                <tr key={`${item.time}-${item.action}`}>
                  <td className="rounded-l-[0.9rem] bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-700">
                    {item.time}
                  </td>
                  <td className="bg-slate-50 px-4 py-4 text-sm text-slate-600">
                    {item.action}
                  </td>
                  <td className="bg-slate-50 px-4 py-4 text-sm text-slate-600">
                    {item.owner}
                  </td>
                  <td className="rounded-r-[0.9rem] bg-slate-50 px-4 py-4 text-sm">
                    <span className="admin-badge">{item.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
