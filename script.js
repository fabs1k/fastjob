// ======================================
// Firebase Database Reference
const database = firebase.database();
const jobsRef = database.ref('jobs');

// ======================================
// СИСТЕМА КОНТРОЛЯ ЗАГРУЗКИ (чтобы всё появилось разом)
let pageReadyFlags = {
  jobsReady: false,
  calendarReady: false,
  detailsReady: false
};

function markAsReady(component) {
  pageReadyFlags[component] = true;
  checkAndShowPage();
}

function checkAndShowPage() {
  // Определяем, какие компоненты должны загрузиться на текущей странице
  const needsJobs =
    document.getElementById('jobsList') ||
    document.getElementById('jobsContainer');

  const needsCalendar = document.getElementById('calendar');
  const needsDetails = document.getElementById('jobDetailContainer');

  // Проверяем: всё ли загружено из того, что нужно?
  let allReady = true;

  if (needsJobs && !pageReadyFlags.jobsReady) allReady = false;
  if (needsCalendar && !pageReadyFlags.calendarReady) allReady = false;
  if (needsDetails && !pageReadyFlags.detailsReady) allReady = false;

  // Если всё готово — показываем
  if (allReady) {
    document.documentElement.classList.remove('js-loading');
    document.documentElement.classList.add('loaded');
  }
}

// ======================================
// Часы и приветствие
function updateTimeAndGreeting() {
  const clockEl = document.getElementById('clock');
  const greetingEl = document.getElementById('greeting');

  const now = new Date();
  let hours = now.getHours();
  let minutes = now.getMinutes();
  if (minutes < 10) minutes = '0' + minutes;

  if (clockEl) clockEl.textContent = `${hours}:${minutes}`;

  let greeting = '';
  if (hours < 12) greeting = 'Доброе утро';
  else if (hours < 18) greeting = 'Добрый день';
  else greeting = 'Добрый вечер';

  if (greetingEl) greetingEl.textContent = greeting;
}
updateTimeAndGreeting();
setInterval(updateTimeAndGreeting, 1000);

// ======================================
// Календарь
function renderCalendar() {
  const calendarEl = document.getElementById('calendar');
  const calendarHeader = document.getElementById('calendarHeader');

  if (!calendarEl || !calendarHeader) {
    markAsReady('calendarReady'); // Календаря нет на странице
    return;
  }

  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth();
  const today = date.getDate();

  const monthNames = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
  const dayNames = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];

  calendarHeader.textContent = `${monthNames[month]} ${year}`;
  calendarEl.innerHTML = '';

  const grid = document.createElement('div');
  grid.style.display = 'grid';
  grid.style.gridTemplateColumns = 'repeat(7, 1fr)';
  grid.style.gap = '5px';

  dayNames.forEach(d => {
    const cell = document.createElement('div');
    cell.textContent = d;
    cell.style.fontWeight = 'bold';
    cell.style.textAlign = 'center';
    cell.style.padding = '5px 0';
    grid.appendChild(cell);
  });

  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startDay = (first.getDay() + 6) % 7;

  for (let i = 0; i < startDay; i++) grid.appendChild(document.createElement('div'));

  for (let d = 1; d <= last.getDate(); d++) {
    const cell = document.createElement('div');
    cell.textContent = d;
    cell.style.padding = '10px';
    cell.style.textAlign = 'center';
    cell.style.borderRadius = '4px';
    cell.style.background = '#f9f9f9';
    cell.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
    if (d === today) {
      cell.style.background = '#0073b1';
      cell.style.color = '#fff';
      cell.style.fontWeight = 'bold';
    }
    grid.appendChild(cell);
  }

  calendarEl.appendChild(grid);

  // Календарь готов!
  markAsReady('calendarReady');
}

// ======================================
// Работа с вакансиями (Firebase)
function getJobs(callback) {
  jobsRef.once('value', (snapshot) => {
    const jobs = [];
    snapshot.forEach((childSnapshot) => {
      jobs.push(childSnapshot.val());
    });
    jobs.sort((a, b) => b.id - a.id);
    callback(jobs);
  });
}

function saveJob(job) {
  jobsRef.child(job.id).set(job);
}

function deleteJob(jobId) {
  jobsRef.child(jobId).remove();
}

function updateJob(job) {
  jobsRef.child(job.id).update(job);
}

// универсальный рендер вакансий
function renderJobs(filteredJobs = null) {
  const jobsListEl =
    document.getElementById('jobsList') ||
    document.getElementById('jobsContainer');

  if (!jobsListEl) {
    markAsReady('jobsReady'); // Вакансий нет на странице
    return;
  }

  if (filteredJobs) {
    displayJobs(jobsListEl, filteredJobs);
  } else {
    getJobs((jobs) => {
      displayJobs(jobsListEl, jobs);
    });
  }
}

function displayJobs(container, jobs) {
  container.innerHTML = '';

  const path = window.location.pathname;
  const isIndex =
    path.includes('index.html') ||
    path === '/' ||
    path === '';

  let displayJobs = jobs;
  if (isIndex) {
    displayJobs = jobs.slice(0, 3);
  }

  if (displayJobs.length === 0) {
    container.textContent = 'Вакансий пока нет.';
    markAsReady('jobsReady');
    return;
  }

  displayJobs.forEach(job => {
    const card = document.createElement('div');
    card.className = 'job-card';

    const title = document.createElement('h4');
    const link = document.createElement('a');
    link.href = `job-detail.html?id=${job.id}`;
    link.textContent = job.title;
    link.style.textDecoration = 'none';
    link.style.color = '#0073b1';
    title.appendChild(link);

    const company = document.createElement('div');
    company.className = 'job-meta';
    company.textContent = 'Компания: ' + job.company;

    const city = document.createElement('div');
    city.className = 'job-meta';
    city.textContent = 'Город: ' + job.city;

    const salary = document.createElement('div');
    salary.className = 'job-meta';
    salary.textContent = 'Зарплата: ' + job.salary;

    card.appendChild(title);
    card.appendChild(company);
    card.appendChild(city);
    card.appendChild(salary);

    // КНОПКИ "ИЗМЕНИТЬ/УДАЛИТЬ" УБРАНЫ: ничего не добавляем в card

    container.appendChild(card);
  });

  // ВСЁ НАРИСОВАЛОСЬ — помечаем вакансии как готовые
  markAsReady('jobsReady');
}

// ======================================
// Фильтр вакансий
function applyFilter() {
  const path = window.location.pathname;

  const isIndex =
    path.includes('index.html') ||
    path === '/' ||
    path === '';

  const isJobsPage = path.includes('jobs.html');

  getJobs((allJobs) => {
    if (isIndex) {
      const cityInput = document.getElementById('filterCity');
      const salaryInput = document.getElementById('filterSalary');

      if (!cityInput && !salaryInput) {
        renderJobs();
        return;
      }

      const cityValue = cityInput ? cityInput.value.trim().toLowerCase() : '';
      const minSalary = salaryInput ? Number(salaryInput.value) || 0 : 0;

      const filtered = allJobs.filter(job => {
        const jobCity = (job.city || '').toLowerCase();
        const jobSalaryNum = parseInt(job.salary) || 0;

        const cityOk = cityValue === '' || jobCity.includes(cityValue);
        const salaryOk = minSalary === 0 || jobSalaryNum >= minSalary;

        return cityOk && salaryOk;
      });

      renderJobs(filtered);
      return;
    }

    if (isJobsPage) {
      const searchInput = document.getElementById('searchText');
      const cityInputJobs = document.getElementById('filterCityJobs');
      const salaryInputJobs = document.getElementById('filterSalaryJobs');

      if (!searchInput && !cityInputJobs && !salaryInputJobs) {
        renderJobs();
        return;
      }

      const searchValue = searchInput ? searchInput.value.trim().toLowerCase() : '';
      const cityValueJobs = cityInputJobs ? cityInputJobs.value.trim().toLowerCase() : '';
      const minSalaryJobs = salaryInputJobs ? Number(salaryInputJobs.value) || 0 : 0;

      const filtered = allJobs.filter(job => {
        const title = (job.title || '').toLowerCase();
        const company = (job.company || '').toLowerCase();
        const jobCity = (job.city || '').toLowerCase();
        const jobSalaryNum = parseInt(job.salary) || 0;

        const textOk =
          searchValue === '' ||
          title.includes(searchValue) ||
          company.includes(searchValue);

        const cityOk =
          cityValueJobs === '' ||
          jobCity.includes(cityValueJobs);

        const salaryOk =
          minSalaryJobs === 0 ||
          jobSalaryNum >= minSalaryJobs;

        return textOk && cityOk && salaryOk;
      });

      renderJobs(filtered);
    }
  });
}

// ======================================
// Отображение деталей вакансии
function renderJobDetail() {
  const container = document.getElementById('jobDetailContainer');

  if (!container) {
    markAsReady('detailsReady'); // Деталей нет на странице
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const jobId = urlParams.get('id');

  if (!jobId) {
    container.innerHTML = '<p style="color:red;">Вакансия не найдена</p>';
    markAsReady('detailsReady');
    return;
  }

  jobsRef.child(jobId).once('value', (snapshot) => {
    const job = snapshot.val();

    if (!job) {
      container.innerHTML = '<p style="color:red;">Вакансия не найдена</p>';
      markAsReady('detailsReady');
      return;
    }

    const messengerBlock = job.messenger ? `
      <div style="margin:15px 0;">
        <strong>Мессенджер:</strong> <a href="${job.messenger}" target="_blank" class="detail-link" style="color:#0073b1;">${job.messenger}</a>
      </div>
    ` : '';

    const responseLink = job.messenger || job.link;

    container.innerHTML = `
      <h1 style="color:#0073b1; margin-top:0;">${job.title}</h1>

      <div style="margin:15px 0;">
        <strong>Компания:</strong> ${job.company}
      </div>

      <div style="margin:15px 0;">
        <strong>Город:</strong> ${job.city}
      </div>

      <div style="margin:15px 0;">
        <strong>Зарплата:</strong> ${job.salary}
      </div>

      <div style="margin:15px 0;">
        <strong>Email:</strong> <a href="mailto:${job.email}" class="detail-link" style="color:#0073b1;">${job.email}</a>
      </div>

      <div style="margin:15px 0;">
        <strong>Телефон:</strong> <a href="tel:${job.phone}" class="detail-link" style="color:#0073b1;">${job.phone}</a>
      </div>

      ${messengerBlock}

      <div style="margin:20px 0; padding-top:20px; border-top:1px solid #ddd;">
        <h3 style="color:#0073b1;">Описание вакансии</h3>
        <p style="line-height:1.6; white-space:pre-wrap;">${job.desc || 'Описание не указано'}</p>
      </div>

      <div style="margin-top:30px;">
        <a href="${responseLink}" target="_blank" id="responseBtn" style="display:inline-block; padding:12px 24px; background:#0073b1; color:#fff; text-decoration:none; border-radius:6px; font-weight:500; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
          Откликнуться
        </a>
      </div>
    `;

    const responseBtn = document.getElementById('responseBtn');
    if (responseBtn) {
      responseBtn.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-3px) scale(1.05)';
        this.style.boxShadow = '0 6px 15px rgba(0,115,177,0.4)';
        this.style.background = '#005a8d';
      });

      responseBtn.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
        this.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
        this.style.background = '#0073b1';
      });
    }

    const detailLinks = container.querySelectorAll('.detail-link');
    detailLinks.forEach(link => {
      link.addEventListener('mouseenter', function() {
        this.style.color = '#005a8d';
        this.style.textDecoration = 'underline';
      });

      link.addEventListener('mouseleave', function() {
        this.style.color = '#0073b1';
        this.style.textDecoration = 'none';
      });
    });

    // Детали готовы!
    markAsReady('detailsReady');
  });
}

// ======================================
// Добавление вакансий
const addForm = document.getElementById('addJobForm');
if (addForm) {
  addForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const formData = new FormData(addForm);
    const newJob = {
      id: Date.now(),
      title: formData.get('title'),
      company: formData.get('company'),
      city: formData.get('city'),
      salary: formData.get('salary'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      messenger: formData.get('messenger') || '',
      desc: formData.get('desc'),
      link: formData.get('messenger') || 'https://example.com/job-' + Date.now()
    };

    saveJob(newJob);
    addForm.reset();
    alert('Вакансия добавлена!');
  });
}

// ======================================
// Инициализация
document.addEventListener('DOMContentLoaded', () => {
  renderJobs();
  renderCalendar();
  renderJobDetail();

  const applyBtn = document.getElementById('applyFilterBtn');
  const clearBtn = document.getElementById('clearFilterBtn');

  if (applyBtn) {
    applyBtn.addEventListener('click', applyFilter);
  }
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      const cityInput = document.getElementById('filterCity');
      const salaryInput = document.getElementById('filterSalary');
      if (cityInput) cityInput.value = '';
      if (salaryInput) salaryInput.value = '';
      renderJobs();
    });
  }

  const applyJobsBtn = document.getElementById('applyFilterJobsBtn');
  const clearJobsBtn = document.getElementById('clearFilterJobsBtn');

  if (applyJobsBtn) {
    applyJobsBtn.addEventListener('click', applyFilter);
  }
  if (clearJobsBtn) {
    clearJobsBtn.addEventListener('click', () => {
      const searchInput = document.getElementById('searchText');
      const cityInputJobs = document.getElementById('filterCityJobs');
      const salaryInputJobs = document.getElementById('filterSalaryJobs');
      if (searchInput) searchInput.value = '';
      if (cityInputJobs) cityInputJobs.value = '';
      if (salaryInputJobs) salaryInputJobs.value = '';
      renderJobs();
    });
  }
});
