
    let submissionsCache = {};

    function openModal(sessionId) {
      const data = submissionsCache[sessionId];
      if(!data) return;
      
      const modalContent = document.getElementById('modal-content');
      document.getElementById('modal-title').textContent = `[ ${data.roll_no} ] CODE_SUBMISSIONS`;
      
      let html = '';
      if (!data.coding || data.coding.length === 0) {
        html = '<p class="violation-row critical">> NO CODE SUBMITTED</p>';
      } else {
        data.coding.forEach(c => {
          html += `
            <div style="margin-bottom: 2rem;">
              <h3 style="color: var(--amber); margin-bottom: 10px;">> Challenge: ${c.challenge_code} | Verdict: [ ${c.verdict} ]</h3>
              <p>Cases Passed: ${c.cases_passed || 0}/${c.total_cases || 0}</p>
              <pre class="code-block">${c.submitted_code ? c.submitted_code.replace(/</g, '&lt;').replace(/>/g, '&gt;') : '/* No code saved */'}</pre>
              ${c.compiler_output ? `<p style="color: var(--red);">Compiler Output:</p><pre class="code-block" style="color: var(--red);">${c.compiler_output.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>` : ''}
            </div>
          `;
        });
      }
      modalContent.innerHTML = html;
      document.getElementById('code-modal').classList.add('active');
    }

    function closeModal() {
      document.getElementById('code-modal').classList.remove('active');
    }
    let lastLogId = 0;

    function createToast(title, msg) {
      const container = document.getElementById('toast-container');
      const toast = document.createElement('div');
      toast.className = 'toast';
      toast.innerHTML = `<div class="toast-title">${title}</div><div class="toast-body">${msg}</div>`;
      container.appendChild(toast);
      
      // trigger reflow
      void toast.offsetWidth;
      toast.classList.add('show');
      
      // Attempt to play a simple beep (ignores if audio context locked)
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(400, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.3);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.3);
      } catch (e) {}

      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
      }, 5000);
    }

    function fetchLogs() {
      fetch('/api/admin/violations')
        .then(r => r.json())
        .then(data => {
          // Render Summary Table
          const sumBody = document.getElementById('summary-body');
          sumBody.innerHTML = '';
          if (data.summary && data.summary.length > 0) {
            data.summary.forEach(s => {
              const tr = document.createElement('tr');
              // Highlight if they have too many violations
              if (s.tab_switches > 2 || s.pastes > 0) tr.className = 'violation-row critical';
              
              tr.innerHTML = `
                <td>${s.full_name || 'UNKNOWN'}</td>
                <td>${s.roll_no || '-'}</td>
                <td>[ ${s.tab_switches} ]</td>
                <td>[ ${s.pastes} ]</td>
              `;
              sumBody.appendChild(tr);
            });
          } else {
            sumBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px; color:var(--gdim);">NO ACTIVE SESSIONS FOUND.</td></tr>';
          }

          // Render Logs Table
          const tbody = document.getElementById('logs-body');
          tbody.innerHTML = '';
          
          if (!data.violations || data.violations.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px; color:var(--gdim);">NO LOGS FOUND.</td></tr>';
            return;
          }

          let newLogs = [];

          data.violations.forEach(log => {
            if (log.id > lastLogId && lastLogId !== 0) {
              newLogs.push(log);
            }
            
            const tr = document.createElement('tr');
            tr.className = 'violation-row' + (log.event_type === 'TAB_SWITCH' ? ' critical' : '');
            
            const timeStr = new Date(log.logged_at).toLocaleTimeString();
            tr.innerHTML = `
              <td>${log.roll_no || 'UNKNOWN'}</td>
              <td>${timeStr}</td>
              <td>[ ${log.event_type} ] ${log.details || '-'}</td>
            `;
            tbody.appendChild(tr);
          });

          // Trigger toasts for new logs
          if (newLogs.length > 0) {
            // Sort new logs ascending so older ones pop up first
            newLogs.sort((a,b) => a.id - b.id).forEach(log => {
              createToast(`! ${log.event_type} !`, `Subject: ${log.full_name || log.roll_no || 'Unknown'}<br>${log.details}`);
            });
          }

          if (data.violations.length > 0) {
            lastLogId = Math.max(...data.violations.map(l => l.id));
          }
        });
        });
    }

    function fetchSubmissions() {
      fetch('/api/admin/submissions')
        .then(res => res.json())
        .then(data => {
          if (!data.success) return;
          const tBody = document.getElementById('submissions-body');
          tBody.innerHTML = '';
          
          if (!data.submissions || data.submissions.length === 0) {
            tBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px; color:var(--gdim);">NO COMPLETED ASSESSMENTS YET.</td></tr>';
            return;
          }

          data.submissions.forEach(s => {
            submissionsCache[s.session_id] = s;
            const tr = document.createElement('tr');
            const timeStr = new Date(s.submitted_at).toLocaleString();
            tr.innerHTML = `
              <td>${s.full_name || 'UNKNOWN'}</td>
              <td>${s.roll_no || '-'}</td>
              <td><strong style="color: var(--amber);">${s.mcq_score !== null ? s.mcq_score : 0}/${s.total_mcq !== null ? s.total_mcq : 0}</strong></td>
              <td>${timeStr}</td>
              <td><button onclick="openModal(${s.session_id})" style="background: transparent; color: var(--cyan); border: 1px solid var(--cyan); cursor: pointer; padding: 4px 8px; font-family: var(--vt);">[ VIEW_CODE ]</button></td>
            `;
            tBody.appendChild(tr);
          });
        })
        .catch(err => console.error('Error fetching submissions:', err));
    }

    // --- TERMINAL LOGIN LOGIC ---
    let loginStep = 0;
    let username = '';
    const termInput = document.getElementById('term-input');
    const termPrompt = document.getElementById('term-prompt');
    const termOutput = document.getElementById('term-output');

    termInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const val = termInput.value.trim();
        if (loginStep === 0) {
          username = val;
          termOutput.innerHTML += `<div>proctor-node login: ${username}</div>`;
          termPrompt.textContent = `Password: `;
          termInput.value = '';
          termInput.type = 'password';
          loginStep = 1;
        } else if (loginStep === 1) {
          // Password entered
          termOutput.innerHTML += `<div>Password: ${'*'.repeat(val.length)}</div>`;
          if (username === 'admin' && val === 'root') {
            termOutput.innerHTML += `<br><div style="color:var(--cyan); text-shadow: 0 0 5px var(--cyan);">Access Granted. Authenticating session...</div>`;
            termInput.disabled = true;
            
            setTimeout(() => {
              termOutput.innerHTML += `<div style="color:var(--cyan); text-shadow: 0 0 5px var(--cyan);">Loading PROCTORING_CONTROL_CENTER...</div>`;
            }, 800);

            setTimeout(() => {
              const termOverlay = document.getElementById('login-terminal');
              termOverlay.style.transition = 'opacity 0.5s ease';
              termOverlay.style.opacity = '0';
              setTimeout(() => {
                termOverlay.style.display = 'none';
                fetchLogs();
                fetchSubmissions();
                setInterval(fetchLogs, 3000);
                setInterval(fetchSubmissions, 5000);
              }, 500);
            }, 1800);
            
          } else {
            setTimeout(() => {
              termOutput.innerHTML += `<div style="color:var(--red); text-shadow: 0 0 5px var(--red-glow);">Login incorrect</div><br>`;
              termPrompt.textContent = `proctor-node login: `;
              termInput.value = '';
              termInput.type = 'text';
              loginStep = 0;
            }, 500);
          }
        }
      }
    });

    // Keep focus on input
    document.getElementById('login-terminal').addEventListener('click', () => termInput.focus());

  