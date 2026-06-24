/* c:/Users/Reyhan/Documents/spk/js/archive.js */
let currentUserId = null;

auth_onStateChanged(async (user) => {
    if (!user) {
        window.location.href = 'login.php';
        return;
    }
    currentUserId = user.uid;
    loadArchives();
});

async function loadArchives() {
    if (!currentUserId) return;

    document.getElementById('archive-loading').style.display = 'block';
    document.getElementById('archive-content').style.display = 'none';
    document.getElementById('archive-empty').style.display = 'none';

    const archives = await db_getArchivedProjects(currentUserId);
    
    document.getElementById('archive-loading').style.display = 'none';

    if (archives.length === 0) {
        document.getElementById('archive-empty').style.display = 'block';
    } else {
        const container = document.getElementById('archive-content');
        container.style.display = 'grid';
        container.innerHTML = '';

        archives.forEach((proj) => {
            const formattedDate = new Date(proj.createdAt).toLocaleDateString('id-ID', {
                year: 'numeric', month: 'short', day: 'numeric'
            });
            
            const numCrit = proj.criteria.length;
            const numAlt = proj.alternatives.length;

            container.innerHTML += `
                <div class="glass-panel archive-card">
                    <h4 class="archive-title">${proj.name}</h4>
                    <div class="archive-meta">
                        <span><i data-lucide="calendar" class="icon-12-mr-4"></i> ${formattedDate}</span>
                        <span><i data-lucide="settings-2" class="icon-12-mr-4"></i> Metode: ${proj.activeMethod.toUpperCase()}</span>
                        <span><i data-lucide="layers" class="icon-12-mr-4"></i> ${numCrit} Kriteria & ${numAlt} Alternatif</span>
                    </div>
                    <div class="archive-actions">
                        <button onclick="activateArchive('${proj.id}')" class="btn btn-primary btn-flex-1">
                            <i data-lucide="folder-open" class="icon-14"></i> Buka & Aktifkan
                        </button>
                        <button onclick="deleteArchive('${proj.id}')" class="btn btn-danger btn-p-05">
                            <i data-lucide="trash-2" class="icon-14"></i>
                        </button>
                    </div>
                </div>
            `;
        });
    }

    if (window.lucide) lucide.createIcons();
}

async function activateArchive(projId) {
    if (!currentUserId) return;
    
    const confirmAct = confirm("Apakah Anda ingin mengaktifkan proyek ini? Proyek yang sedang aktif saat ini akan diarsipkan.");
    if (confirmAct) {
        const result = await db_setProjectActive(currentUserId, projId);
        if (result.success) {
            showToast("Proyek berhasil diaktifkan!", "success");
            setTimeout(() => {
                window.location.href = 'dashboard.php';
            }, 1000);
        } else {
            showToast("Gagal mengaktifkan proyek: " + result.error, "error");
        }
    }
}

async function deleteArchive(projId) {
    if (!currentUserId) return;

    const confirmDel = confirm("Apakah Anda yakin ingin menghapus arsip proyek ini secara permanen?");
    if (confirmDel) {
        const result = await db_deleteProject(currentUserId, projId);
        if (result.success) {
            showToast("Arsip berhasil dihapus!", "success");
            loadArchives();
        } else {
            showToast("Gagal menghapus arsip: " + result.error, "error");
        }
    }
}
