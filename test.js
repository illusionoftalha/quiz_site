
    // Time loop
    setInterval(() => {
      const n = new Date();
      document.getElementById('clk').textContent = [n.getHours(), n.getMinutes(), n.getSeconds()].map(x => String(x).padStart(2, '0')).join(':');
    }, 1000);

    const student = JSON.parse(sessionStorage.getItem('student'));
    let sessionId = sessionStorage.getItem('session_id');

    if (!student) {
      window.location.href = 'index.html';
    } else {
      document.getElementById('student-info').textContent = `AUTH_USER: ${student.roll_no} // STATUS: IDLE`;
      document.getElementById('s-name').textContent = student.full_name;
      loadAssessments();
    }

    function nav(id) {
      document.querySelectorAll('.section').forEach(e => e.classList.remove('active'));
      document.querySelectorAll('.sb-item').forEach(e => e.classList.remove('active'));
      document.getElementById(`sec-${id}`).classList.add('active');
      if(window.event && window.event.target) window.event.target.classList.add('active');
    }

    // Assessment Selection
    let currentVersion = null;

    function loadAssessments() {
      if(!student) return;
      fetch('/api/student/assessments/' + student.roll_no)
        .then(r => r.json())
        .then(d => {
          const list = document.getElementById('assessment-list');
          list.innerHTML = '';
          if(!d.assessments || d.assessments.length === 0) {
            list.innerHTML = '<span class="red-txt" style="font-size: 1.2rem; font-weight: bold;">NO ASSESSMENTS AVAILABLE IN DATABASE</span>';
            return;
          }
          d.assessments.forEach(a => {
            const isCompleted = a.mcq_score !== null;
            const statusText = isCompleted ? `COMPLETED | SCORE: ${a.mcq_score}/${a.total_mcq || a.total_questions}` : 'PENDING';

            const btn = document.createElement('button');
            btn.className = 'obtn' + (isCompleted ? ' completed' : '');
            btn.innerHTML = `<span>[ ${a.version_code} ] ${a.total_questions} MODULES</span> <span>[ ${statusText} ]</span>`;
            btn.onclick = () => startAssessment(a.version_code);
            list.appendChild(btn);
          });
        });
    }

    function startAssessment(version_code) {
      fetch('/api/start_assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roll_no: student.roll_no, version_code })
      }).then(r=>r.json()).then(data => {
        if(data.success) {
          sessionId = data.session_id;
          sessionStorage.setItem('session_id', sessionId);
          currentVersion = version_code;
          document.getElementById('student-info').textContent = `AUTH_USER: ${student.roll_no} // SESSION: ${sessionId}`;
          alert('>>> ASSESSMENT ' + version_code + ' INITIATED. PROCEED TO MODULES.');
          loadAssessmentData(version_code);
        }
      });
    }
function loadAssessmentData(v_code) {
  // Load MCQs
  fetch(`/api/mcq/${v_code}`).then(r => r.json()).then(d => {
    mcqData = d.questions || [];
    mcqIndex = 0;
    mcqAnswers = [];
    if(mcqData.length > 0) loadMcq();
    else document.getElementById('q-text').textContent = "NO MCQ QUESTIONS FOUND IN MODULE.";
  });

  // Load Coding Challenges
  fetch(`/api/coding/${v_code}`).then(r => r.json()).then(d => {
    codingData = d.challenges || [];
    codingIndex = 0;
    if(codingData.length > 0) setupCodingTabs();
    else document.getElementById('c-title').textContent = "NO CODING CHALLENGES FOUND.";
  });
}

// --- MCQ LOGIC ---
let mcqData = [];
let mcqIndex = 0;
let mcqAnswers = [];
let mcqAnswered = false;

function loadMcq() {
  mcqAnswered = false;
  const q = mcqData[mcqIndex];
  document.getElementById('q-label').textContent = `Q ${mcqIndex + 1}/${mcqData.length} | ${q.topic || 'GENERAL'}`;
  document.getElementById('q-text').textContent = q.question_text;
  
  const qc = document.getElementById('q-code');
  if(q.code_snippet) { qc.style.display = 'block'; qc.textContent = q.code_snippet; }
  else { qc.style.display = 'none'; }
  
  document.getElementById('q-msg').textContent = '';
  document.getElementById('q-next').disabled = true;
  document.getElementById('q-next').textContent = mcqIndex === mcqData.length - 1 ? 'SUBMIT >>' : 'NEXT >>';
  
  const optsDiv = document.getElementById('q-opts');
  optsDiv.innerHTML = '';
  const opts = [q.opt_a, q.opt_b, q.opt_c, q.opt_d];
  
  opts.forEach((optText, i) => {
    if(!optText) return;
    const letter = ['A','B','C','D'][i];
    const btn = document.createElement('button');
    btn.className = 'opt-btn';
    btn.innerHTML = `[${letter}] ${optText}`;
    btn.onclick = () => pickMcq(i, btn);
    optsDiv.appendChild(btn);
  });
}

function pickMcq(optIndex, btn) {
  if(mcqAnswered) return;
  mcqAnswered = true;
  
  document.querySelectorAll('.opt-btn').forEach(b => b.disabled = true);
  btn.classList.add('correct');
  
  mcqAnswers.push({ q_id: mcqData[mcqIndex].id, selected_opt: optIndex });
  
  document.getElementById('q-msg').textContent = `> SELECTION RECORDED`;
  document.getElementById('q-next').disabled = false;
}

function nextMcq() {
  if (mcqIndex < mcqData.length - 1) {
    mcqIndex++;
    loadMcq();
  } else {
    fetch('/api/submit_mcq', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ session_id: sessionId, answers: mcqAnswers, total_mcq: mcqData.length })
    }).then(r=>r.json()).then(data => {
      document.getElementById('mcq-container').style.display = 'none';
      const d = document.getElementById('mcq-done');
      d.classList.remove('hidden');
      d.style.display = 'block';
      document.getElementById('mcq-score').textContent = data.score;
      document.getElementById('mcq-total').textContent = data.total;
      loadAssessments(); // Refresh assessment status
    });
  }
}

// --- CODING LOGIC ---
let codingData = [];
let codingIndex = 0;

function setupCodingTabs() {
  const tabs = document.getElementById('code-tabs');
  tabs.innerHTML = '';
  codingData.forEach((c, i) => {
    const btn = document.createElement('button');
    btn.className = `tab-btn ${i === codingIndex ? 'active' : ''}`;
    btn.textContent = `PROB_0${i + 1}`;
    btn.onclick = () => { codingIndex = i; loadCoding(); setupCodingTabs(); };
    tabs.appendChild(btn);
  });
  loadCoding();
}

function loadCoding() {
  const c = codingData[codingIndex];
  document.getElementById('c-title').textContent = `[${c.challenge_code}] ${c.title}`;
  document.getElementById('c-desc').textContent = c.description;
  document.getElementById('c-constraints').textContent = c.constraints_txt || 'None';
  document.getElementById('c-s-in').textContent = c.sample_input || 'None';
  document.getElementById('c-s-out').textContent = c.sample_output || 'None';
  
  document.getElementById('c-editor').value = `#include <stdio.h>\\n\\nint main() {\\n    // Write your solution for ${c.challenge_code}\\n    return 0;\\n}`;
  document.getElementById('c-out').textContent = 'Ready for input...';
  document.getElementById('c-status').textContent = '';
  document.getElementById('c-status').className = '';
}

function submitCode() {
  const c = codingData[codingIndex];
  const code = document.getElementById('c-editor').value;
  const out = document.getElementById('c-out');
  const statusEl = document.getElementById('c-status');
  
  out.textContent = '> Compiling code and executing test cases...';
  statusEl.textContent = 'EXECUTING...';
  statusEl.style.color = 'var(--amber)';
  statusEl.className = '';
  
  fetch('/api/submit_code', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ session_id: sessionId, challenge_code: c.challenge_code, code })
  }).then(r=>r.json()).then(data => {
    statusEl.textContent = `VERDICT: ${data.verdict} [${data.cases_passed||0}/${data.total_cases||0}]`;
    statusEl.className = `verdict-${data.verdict}`;
    
    if(data.verdict === 'COMPILE_ERROR') {
      out.textContent = data.output;
    } else if(data.verdict === 'ACCEPTED') {
      out.textContent = "> Execution Successful.\n> All test cases passed.";
    } else {
      out.textContent = data.details || "> Execution Failed on hidden test cases.";
    }
  }).catch(e => {
    out.textContent = '> Fatal Server Error.';
    statusEl.textContent = 'SYSTEM_ERROR';
  });
}
  