'use client';

import { useState, useMemo, useEffect } from 'react';
import { AppliedProject } from './job-history.types';
import { MonthValue } from '@/components/molecules/MonthSelect';
import { YearValue } from '@/components/molecules/YearSelect';

export function useJobHistory(projects: AppliedProject[]) {
  // Use Guatemala timezone (America/Guatemala) to ensure server and client evaluate the same current year/month
  const { currentYearStr, currentMonth } = useMemo(() => {
    try {
      const options = { timeZone: 'America/Guatemala', year: 'numeric', month: 'numeric' } as const;
      const formatter = new Intl.DateTimeFormat('en-US', options);
      const parts = formatter.formatToParts(new Date());
      const year = parts.find((p) => p.type === 'year')?.value || new Date().getFullYear().toString();
      const month = parts.find((p) => p.type === 'month')?.value || (new Date().getMonth() + 1).toString();
      return { currentYearStr: year, currentMonth: month };
    } catch (e) {
      return {
        currentYearStr: new Date().getFullYear().toString(),
        currentMonth: (new Date().getMonth() + 1).toString(),
      };
    }
  }, []);

  const [selectedProject, setSelectedProject] = useState<AppliedProject | null>(null);
  const [stateFilter, setStateFilter] = useState<'all' | 'pending' | 'unpaid' | 'paid'>('all');
  const [yearFilter, setYearFilter] = useState<YearValue>(currentYearStr as YearValue);
  const [monthFilter, setMonthFilter] = useState<MonthValue>(currentMonth as MonthValue);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const pageSize = 16;

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [stateFilter, yearFilter, monthFilter]);

  // Years options - dynamic from projects + current year (as numbers)
  const yearOptions = useMemo(() => {
    const defaultYear = parseInt(currentYearStr, 10) || new Date().getFullYear();
    const years = new Set<number>([defaultYear]);
    projects.forEach((p) => {
      const dateStr = p.schedule && p.schedule[0] ? p.schedule[0].date : p.created_at;
      if (dateStr) {
        const year = parseInt(dateStr.split('-')[0], 10);
        if (!isNaN(year)) {
          years.add(year);
        }
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [projects, currentYearStr]);

  // Filtered projects
  const filteredProjects = useMemo(() => {
    const now = new Date();
    return projects.filter((p) => {
      // Determine project work state
      let isProjectFinished = false;
      if (p.schedule && p.schedule.length > 0) {
        const sorted = [...p.schedule].sort((a, b) => a.date.localeCompare(b.date));
        const lastSchedule = sorted[sorted.length - 1];
        const lastDate = new Date(`${lastSchedule.date}T23:59:59`);
        isProjectFinished = lastDate < now;
      }

      const isPaid = p.isPaid;
      let computedState: 'pending' | 'unpaid' | 'paid';
      if (isPaid) {
        computedState = 'paid';
      } else if (isProjectFinished) {
        computedState = 'unpaid';
      } else {
        computedState = 'pending';
      }

      // 1. State Filter
      if (stateFilter !== 'all' && computedState !== stateFilter) {
        return false;
      }

      // Project date logic
      const dateStr = p.schedule && p.schedule[0] ? p.schedule[0].date : p.created_at;
      if (!dateStr) return false;

      const [year, month] = dateStr.split('-');

      // 3. Year Filter
      if (yearFilter !== 'all' && year !== yearFilter) {
        return false;
      }

      // 4. Month Filter
      if (monthFilter !== 'all') {
        const pMonth = parseInt(month, 10).toString();
        const fMonth = parseInt(monthFilter, 10).toString();
        if (pMonth !== fMonth) {
          return false;
        }
      }

      return true;
    });
  }, [projects, stateFilter, yearFilter, monthFilter]);

  const totalPages = Math.ceil(filteredProjects.length / pageSize);

  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProjects.slice(start, start + pageSize);
  }, [filteredProjects, currentPage, pageSize]);

  return {
    selectedProject,
    setSelectedProject,
    stateFilter,
    setStateFilter,
    yearFilter,
    setYearFilter,
    monthFilter,
    setMonthFilter,
    yearOptions,
    filteredProjects,
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedProjects,
  };
}
