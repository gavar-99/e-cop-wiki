import React, { useMemo } from 'react';
import SearchBar from './SearchBar';
import HighlightsSection from './HighlightsSection';
import { LatestEntries, OnThisDay } from './EntryList';
import { spacing } from '../../styles/theme';

const Dashboard = ({ entries, onNavigate }) => {
  // Featured entry - prioritize entries with substantial content
  const featured = useMemo(() => {
    const candidates = entries.filter((e) => e.content && e.content.length > 500);
    return candidates.length > 0 ? candidates[0] : entries.length > 0 ? entries[0] : null;
  }, [entries]);

  // Recent entries - top 5 newest
  const recent = useMemo(() => {
    return [...entries].sort((a, b) => b.id - a.id).slice(0, 5);
  }, [entries]);

  // On This Day - entries mentioning today's date
  const onThisDay = useMemo(() => {
    const today = new Date();
    const month = today.toLocaleString('en', { month: 'long' });
    const day = today.getDate();

    // Extract dates from content (e.g., "June 6", "6 June", "June 6, 1944")
    const datePattern = new RegExp(`(${month}\\s+${day}|${day}\\s+${month})`, 'i');

    const matches = entries.filter((e) => e.content && datePattern.test(e.content));

    if (matches.length > 0) return matches.slice(0, 3);

    // Fallback: random entries
    const shuffled = [...entries].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 2);
  }, [entries]);

  return (
    <div style={styles.container}>
      <SearchBar entries={entries} onNavigate={onNavigate} />

      <HighlightsSection featured={featured} onNavigate={onNavigate} />

      <div style={styles.gridContainer}>
        <LatestEntries entries={recent} onNavigate={onNavigate} />
        <OnThisDay entries={onThisDay} onNavigate={onNavigate} />
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: `${spacing['5xl']} ${spacing['6xl']}`,
    maxWidth: '1400px',
    margin: '0 auto',
  },
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
    gap: spacing['5xl'],
    marginTop: spacing['5xl'],
  },
};

export default Dashboard;
