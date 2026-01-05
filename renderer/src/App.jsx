import React, { useState, useEffect } from 'react';
import Dashboard from './components/Wiki/Dashboard';
import ArticleView from './components/Wiki/ArticleView';
import EntryForm from './components/Wiki/EntryForm';
import GeminiSidebar from './components/Sidebar/GeminiSidebar';
import Login from './components/Auth/Login';
import TitleBar from './components/Layout/TitleBar';
import NavigationBar from './components/Layout/NavigationBar';
import IntegrityAlert from './components/Layout/IntegrityAlert';
import ResizablePanel from './components/Layout/ResizablePanel';
import Settings from './components/Admin/Settings';
import { useNavigation, useResizableSidebar } from './hooks';
import { VIEWS, SETTINGS_TABS, canEdit } from './constants';
import { colors } from './styles/theme';

const App = () => {
  // Data state
  const [entries, setEntries] = useState([]);
  const [pinnedEntries, setPinnedEntries] = useState([]);
  const [integrityIssues, setIntegrityIssues] = useState([]);

  // Auth state
  const [currentUser, setCurrentUser] = useState(null);

  // UI state
  const [showSettings, setShowSettings] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState(SETTINGS_TABS.DATABASE);
  const [draftTitle, setDraftTitle] = useState('');
  const [editingEntry, setEditingEntry] = useState(null);

  // Custom hooks
  const {
    currentView,
    currentEntry,
    canGoBack,
    canGoForward,
    navigateToEntry,
    goBack,
    goForward,
    setCurrentView,
    setCurrentEntry,
  } = useNavigation();

  const { width: sidebarWidth, startResizing } = useResizableSidebar();

  // Load entries when user is authenticated
  const loadEntries = async () => {
    const data = await window.wikiAPI.getEntries();
    setEntries(data);
  };

  useEffect(() => {
    if (currentUser) {
      loadEntries();
      window.wikiAPI.verifyIntegrity().then((issues) => {
        if (issues && issues.length > 0) {
          setIntegrityIssues(issues);
        }
      });
    }
  }, [currentUser]);

  // Handlers
  const handleLogout = async () => {
    await window.wikiAPI.logout();
    setCurrentUser(null);
  };

  const openSettings = (tab = SETTINGS_TABS.DATABASE) => {
    setSettingsInitialTab(tab);
    setShowSettings(true);
  };

  const handleExportDatabase = async () => {
    try {
      await window.wikiAPI.exportDatabase();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleImportDatabase = async () => {
    try {
      await window.wikiAPI.importDatabase();
      loadEntries();
    } catch (error) {
      console.error('Import failed:', error);
    }
  };

  const handleNavigate = async (titleOrQuery, skipHistory = false) => {
    const exactMatch = entries.find(
      (e) => e.title.toLowerCase() === titleOrQuery.toLowerCase()
    );

    if (exactMatch) {
      if (skipHistory) {
        setCurrentEntry(exactMatch);
        setCurrentView(VIEWS.ARTICLE);
      } else {
        navigateToEntry(exactMatch);
      }
    } else {
      const searchResults = await window.wikiAPI.searchEntries(titleOrQuery);

      if (searchResults.length > 0) {
        setEntries(searchResults);
        setCurrentView(VIEWS.DASHBOARD);
      } else {
        if (canEdit(currentUser?.role)) {
          setDraftTitle(titleOrQuery);
          setCurrentView(VIEWS.ADD);
        } else {
          alert(`No entries found for "${titleOrQuery}".`);
        }
      }
    }
  };

  const handlePin = (entry) => {
    setPinnedEntries((prev) =>
      prev.find((e) => e.id === entry.id)
        ? prev.filter((e) => e.id !== entry.id)
        : [...prev, entry]
    );
  };

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setCurrentView(VIEWS.EDIT);
  };

  const handleDelete = async (entryId) => {
    try {
      const result = await window.wikiAPI.deleteEntry(entryId);
      if (result.success) {
        alert('Entry deleted successfully');
        await loadEntries();
        setCurrentView(VIEWS.DASHBOARD);
        setCurrentEntry(null);
      } else {
        alert('Error deleting entry: ' + result.message);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Error deleting entry: ' + error.message);
    }
  };

  const handleFormComplete = () => {
    loadEntries();
    setCurrentView(VIEWS.DASHBOARD);
    setDraftTitle('');
    setEditingEntry(null);
  };

  // Render login screen if not authenticated
  if (!currentUser) {
    return (
      <>
        <TitleBar transparent={true} />
        <Login onLogin={setCurrentUser} />
      </>
    );
  }

  const userCanEdit = canEdit(currentUser.role);

  return (
    <div style={styles.appContainer}>
      <TitleBar
        transparent={false}
        userRole={currentUser.role}
        onOpenSettings={openSettings}
        onOpenAdmin={openSettings}
        onOpenAbout={() => openSettings(SETTINGS_TABS.ABOUT)}
        onExportDatabase={handleExportDatabase}
        onImportDatabase={handleImportDatabase}
        onLogout={handleLogout}
        onExit={() => window.wikiAPI.close()}
      />

      {showSettings && (
        <Settings
          onClose={() => setShowSettings(false)}
          currentUser={currentUser}
          initialTab={settingsInitialTab}
        />
      )}

      <div style={styles.titleBarSpacer} />

      <IntegrityAlert issues={integrityIssues} />

      <div style={styles.mainLayout}>
        <main style={styles.mainContent}>
          <NavigationBar
            currentView={currentView}
            currentUser={currentUser}
            onViewChange={setCurrentView}
            canGoBack={canGoBack}
            canGoForward={canGoForward}
            onGoBack={goBack}
            onGoForward={goForward}
          />

          <div style={styles.contentArea}>
            {currentView === VIEWS.DASHBOARD && (
              <Dashboard entries={entries} onNavigate={handleNavigate} />
            )}

            {currentView === VIEWS.ARTICLE && (
              <ArticleView
                entry={currentEntry}
                allEntries={entries}
                onNavigate={handleNavigate}
                onPinToAI={handlePin}
                isPinned={pinnedEntries.some((e) => e.id === currentEntry?.id)}
                userRole={currentUser.role}
                currentUsername={currentUser.username}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            )}

            {(currentView === VIEWS.ADD || currentView === VIEWS.EDIT) && (
              userCanEdit ? (
                <EntryForm
                  mode={currentView === VIEWS.EDIT ? 'edit' : 'create'}
                  entry={editingEntry}
                  userRole={currentUser.role}
                  initialTitle={draftTitle}
                  onComplete={handleFormComplete}
                />
              ) : (
                <div>Access Denied</div>
              )
            )}
          </div>
        </main>

        <ResizablePanel width={sidebarWidth} onStartResize={startResizing}>
          <GeminiSidebar
            contextEntries={pinnedEntries}
            onClearContext={() => setPinnedEntries([])}
          />
        </ResizablePanel>
      </div>
    </div>
  );
};

const styles = {
  appContainer: {
    display: 'flex',
    height: '100vh',
    overflow: 'hidden',
    flexDirection: 'column',
  },
  titleBarSpacer: {
    height: '32px',
  },
  mainLayout: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: colors.white,
  },
  contentArea: {
    flex: 1,
    overflowY: 'auto',
  },
};

export default App;
