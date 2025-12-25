import React from 'react';

const Dashboard = ({ entries, onNavigate }) => {
  // Logic for sections
  const featured = entries.length > 0 ? entries[0] : null; // Just pick first for now, or random
  const recent = [...entries].sort((a, b) => b.id - a.id).slice(0, 3);
  
  // "On This Day" mock - finding entries with dates or just random
  const onThisDay = entries.filter(e => e.content.includes('June') || e.content.includes('1944')).slice(0, 2);

  return (
    <div style={{ padding: '20px', width: '100%' }}>
      
      {/* Featured Section */}
      {featured && (
        <section style={{ marginBottom: '30px', backgroundColor: '#fbfbfb', padding: '20px', border: '1px solid #a2a9b1', borderRadius: '2px' }}>
          <h2 style={{ fontFamily: "'Linux Libertine', Georgia, serif", color: '#555', fontSize: '1.1em', margin: '0 0 5px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            From the Archives
          </h2>
          <h1 style={{ fontFamily: "'Linux Libertine', Georgia, serif", fontSize: '2.2em', margin: '0 0 10px 0', cursor: 'pointer', color: '#000' }} onClick={() => onNavigate(featured.title)}>
            {featured.title}
          </h1>
          <p style={{ fontSize: '1.05em', lineHeight: '1.6', color: '#202122' }}>
            {featured.content.substring(0, 300)}...
          </p>
          <button 
            onClick={() => onNavigate(featured.title)}
            style={{ marginTop: '10px', color: '#0645ad', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.95em', fontWeight: 'bold', padding: 0 }}
          >
            Read Full Briefing →
          </button>
        </section>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px' }}>
        
        {/* Recently Added */}
        <section style={{ border: '1px solid #a2a9b1', padding: '15px', backgroundColor: '#fff' }}>
          <h3 style={sectionHeaderStyle}>Recently Declassified</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {recent.map(e => (
              <li key={e.id} style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #eee' }}>
                <a 
                    href="#" 
                    onClick={(evt) => { evt.preventDefault(); onNavigate(e.title); }}
                    style={{ fontSize: '1.05em', fontWeight: 'bold', color: '#0645ad', textDecoration: 'none', fontFamily: "'Linux Libertine', Georgia, serif" }}
                >
                    {e.title}
                </a>
                <div style={{ fontSize: '0.9em', color: '#54595d', marginTop: '4px', lineHeight: '1.4' }}>
                    {e.content.substring(0, 100)}...
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* On This Day / Related */}
        <section style={{ border: '1px solid #a2a9b1', padding: '15px', backgroundColor: '#f9f9f9' }}>
          <h3 style={sectionHeaderStyle}>Operational Timeline</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {onThisDay.map(e => (
              <li key={e.id} style={{ marginBottom: '15px' }}>
                 <div style={{fontSize: '0.8em', color: '#777', textTransform: 'uppercase', marginBottom: '2px'}}>1944</div>
                 <a 
                    href="#" 
                    onClick={(evt) => { evt.preventDefault(); onNavigate(e.title); }}
                    style={{ fontSize: '1.05em', color: '#202122', textDecoration: 'none', fontWeight: 'bold', fontFamily: "'Linux Libertine', Georgia, serif" }}
                >
                    {e.title}
                </a>
              </li>
            ))}
          </ul>
        </section>

      </div>
    </div>
  );
};

const sectionHeaderStyle = {
    fontFamily: 'sans-serif',
    fontSize: '0.9em',
    color: '#72777d',
    borderBottom: '1px solid #a2a9b1',
    paddingBottom: '5px',
    marginBottom: '15px',
    textTransform: 'uppercase',
    fontWeight: 'bold'
};

export default Dashboard;
