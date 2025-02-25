'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, 
  Cell, Legend 
} from 'recharts';

interface AnalyticsData {
  dailyVisits: VisitData[];
  schoolTypeDistribution: Distribution[];
  websiteStatusDistribution: Distribution[];
  topSchools: TopSchool[];
}

interface VisitData {
  date: string;
  visits: number;
  uniqueVisitors: number;
}

interface Distribution {
  name: string;
  value: number;
}

interface TopSchool {
  name: string;
  visits: number;
  percentageChange: number;
}

interface PieLabel {
  name: string;
  percent: number;
}

interface AnalyticsProps {
  data?: AnalyticsData;
  colors?: typeof COLORS;
}

// Mock data
const mockAnalytics: AnalyticsData = {
  dailyVisits: Array.from({ length: 30 }, (_, i) => ({
    date: new Date(2024, 0, i + 1).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    visits: Math.floor(Math.random() * 1000) + 500,
    uniqueVisitors: Math.floor(Math.random() * 800) + 300
  })),
  schoolTypeDistribution: [
    { name: 'Single School', value: 65 },
    { name: 'School Organization', value: 35 }
  ],
  websiteStatusDistribution: [
    { name: 'Published', value: 45 },
    { name: 'Draft', value: 30 },
    { name: 'Archived', value: 25 }
  ],
  topSchools: Array.from({ length: 5 }, (_, i) => ({
    name: `Springfield Elementary ${i + 1}`,
    visits: Math.floor(Math.random() * 5000) + 1000,
    percentageChange: Math.floor(Math.random() * 40) - 20
  }))
};

const COLORS = {
  primary: ['#3b82f6', '#60a5fa', '#93c5fd'],
  success: ['#22c55e', '#4ade80', '#86efac'],
  warning: ['#eab308', '#facc15', '#fde047'],
  danger: ['#ef4444', '#f87171', '#fca5a5']
};

const AnalyticsContent = ({ data, colors }: { data: AnalyticsData, colors: typeof COLORS }) => {
  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
          Analytics Overview
        </h1>
      </div>

      {/* Quick Stats */}
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden rounded-lg shadow-sm ring-1 ring-gray-300 p-6">
          <dt className="text-sm font-medium text-gray-500 truncate">Total Visits</dt>
          <dd className="mt-1 text-3xl font-semibold text-gray-900">128.9k</dd>
          <dd className="mt-2 flex items-center text-sm text-green-600">
            <span>↑ 12% from last month</span>
          </dd>
        </div>
        {/* Add more stat cards */}
      </div>

      {/* Charts Grid */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Traffic Over Time */}
        <div className="bg-white p-6 rounded-lg shadow-sm ring-1 ring-gray-300">
          <h3 className="text-base font-semibold leading-6 text-gray-900 mb-4">Traffic Over Time</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.dailyVisits}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="visits" 
                  stroke={colors.primary[0]} 
                  fill={colors.primary[0]} 
                  fillOpacity={0.1} 
                />
                <Area 
                  type="monotone" 
                  dataKey="uniqueVisitors" 
                  stroke={colors.success[0]} 
                  fill={colors.success[0]} 
                  fillOpacity={0.1} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Website Status Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-sm ring-1 ring-gray-300">
          <h3 className="text-base font-semibold leading-6 text-gray-900 mb-4">Website Status Distribution</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.websiteStatusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }: PieLabel) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {data.websiteStatusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors.primary[index % colors.primary.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Schools Table */}
      <div className="mt-8 bg-white rounded-lg shadow-sm ring-1 ring-gray-300">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-base font-semibold leading-6 text-gray-900">Top Performing Schools</h3>
        </div>
        <div className="border-t border-gray-200">
          <div className="min-w-full divide-y divide-gray-200">
            <table className="min-w-full divide-y divide-gray-300">
              <thead>
                <tr>
                  <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">School</th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Total Visits</th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.topSchools.map((school) => (
                  <tr key={school.name}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                      {school.name}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {school.visits.toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                        school.percentageChange >= 0
                          ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20'
                          : 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20'
                      }`}>
                        {school.percentageChange >= 0 ? '↑' : '↓'} {Math.abs(school.percentageChange)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const AnalyticsPage = dynamic<AnalyticsProps>(
  () => Promise.resolve(({ data = mockAnalytics, colors = COLORS }) => 
    <AnalyticsContent data={data} colors={colors} />
  ),
  { ssr: false }
);

export default AnalyticsPage;
