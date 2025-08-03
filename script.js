// Fungsi untuk menampilkan alert kustom
function showAlert(message, type) {
    const alertBox = document.createElement('div');
    alertBox.className = `alert alert-${type}`;
    alertBox.textContent = message;
    document.body.appendChild(alertBox);

    setTimeout(() => {
        alertBox.classList.add('fade-out');
        alertBox.addEventListener('transitionend', () => alertBox.remove());
    }, 3000);
}

// Fungsi untuk menyimpan transaksi ke Local Storage
function saveTransaction(transaction) {
    let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    transactions.push(transaction);
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

// Fungsi untuk memuat transaksi dari Local Storage
function loadTransactions() {
    const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    const daftarTransaksi = document.getElementById('daftarTransaksi');
    const totalElement = document.getElementById('total');
    let totalPendapatan = 0;

    daftarTransaksi.innerHTML = ''; // Bersihkan tabel sebelum memuat data baru

    if (transactions.length === 0) {
        // Mengubah colspan menjadi 6 karena ada kolom "Jumlah" baru
        daftarTransaksi.innerHTML = '<tr><td colspan="6" style="text-align: center;">Belum ada transaksi.</td></tr>';
        totalElement.textContent = formatRupiah(0);
        return;
    }

    transactions.forEach((transaksi, index) => {
        const row = daftarTransaksi.insertRow();

        // Format tanggal ke DD/MM/YYYY
        const date = new Date(transaksi.tanggal);
        const formattedDate = date.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });

        row.insertCell(0).textContent = formattedDate;
        row.insertCell(1).textContent = transaksi.nama;
        row.insertCell(2).textContent = transaksi.produkNama;
        row.insertCell(3).textContent = transaksi.jumlah; // Menampilkan jumlah produk
        row.insertCell(4).textContent = formatRupiah(transaksi.bayar);

        const statusCell = row.insertCell(5); // Mengubah indeks karena ada kolom baru
        const statusText = document.createElement('span');
        statusText.textContent = transaksi.status;

        // Tambahkan kelas CSS berdasarkan status
        if (transaksi.status.includes('Kurang')) {
            statusText.classList.add('kurang');
        } else if (transaksi.status.includes('Lebih')) {
            statusText.classList.add('lebih');
        } else if (transaksi.status.includes('Pas')) {
            statusText.classList.add('pas');
        }
        statusCell.appendChild(statusText);

        totalPendapatan += transaksi.bayar;
    });

    totalElement.textContent = formatRupiah(totalPendapatan);
}

// Fungsi untuk memformat angka menjadi format Rupiah
function formatRupiah(angka) {
    const reverse = angka.toString().split('').reverse().join('');
    const ribuan = reverse.match(/\d{1,3}/g);
    const result = ribuan.join('.').split('').reverse().join('');
    return 'Rp' + result;
}

// Fungsi untuk menghapus semua transaksi
function clearAllTransactions() {
    // Menggunakan modal kustom sebagai pengganti confirm()
    const confirmModal = document.createElement('div');
    confirmModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1001;
    `;
    confirmModal.innerHTML = `
        <div style="background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.2); text-align: center;">
            <p>Apakah Anda yakin ingin menghapus semua riwayat transaksi?</p>
            <button id="confirmYes" style="background-color: #e74c3c; color: white; border: none; padding: 8px 15px; border-radius: 4px; margin: 5px; cursor: pointer;">Ya</button>
            <button id="confirmNo" style="background-color: #ccc; color: black; border: none; padding: 8px 15px; border-radius: 4px; margin: 5px; cursor: pointer;">Tidak</button>
        </div>
    `;
    document.body.appendChild(confirmModal);

    document.getElementById('confirmYes').addEventListener('click', () => {
        localStorage.removeItem('transactions');
        loadTransactions(); // Muat ulang tabel setelah menghapus
        showAlert('Semua transaksi telah dihapus!', 'success');
        confirmModal.remove();
    });

    document.getElementById('confirmNo').addEventListener('click', () => {
        confirmModal.remove();
    });
}


// Hanya jalankan kode yang relevan dengan form di index.html
if (document.getElementById('transaction-form')) {
    const transactionForm = document.getElementById('transaction-form');
    const tanggalInput = document.getElementById('tanggal');
    const namaInput = document.getElementById('nama');
    const produkSelect = document.getElementById('produk');
    const jumlahInput = document.getElementById('jumlah'); // Ambil elemen jumlah
    const bayarInput = document.getElementById('bayar');

    transactionForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const tanggal = tanggalInput.value;
        const nama = namaInput.value;
        const produkValue = parseInt(produkSelect.value);
        const produkNama = produkSelect.options[produkSelect.selectedIndex].text.split(' - ')[0]; // Ambil hanya nama produk
        const jumlah = parseInt(jumlahInput.value); // Ambil nilai jumlah
        const bayar = parseInt(bayarInput.value);

        // Hitung total harga berdasarkan produk dan jumlah
        const totalHargaProduk = produkValue * jumlah;

        let status = '';
        if (bayar < totalHargaProduk) { // Bandingkan dengan totalHargaProduk
            status = `Kurang Rp${formatRupiah(totalHargaProduk - bayar).substring(2)}`; // Hapus 'Rp' dari formatRupiah
        } else if (bayar > totalHargaProduk) { // Bandingkan dengan totalHargaProduk
            status = `Lebih Rp${formatRupiah(bayar - totalHargaProduk).substring(2)}`;
        } else {
            status = 'Pas';
        }

        const newTransaction = {
            tanggal: tanggal,
            nama: nama,
            produkNama: produkNama,
            produkHarga: produkValue,
            jumlah: jumlah, // Simpan jumlah produk
            bayar: bayar,
            status: status
        };

        saveTransaction(newTransaction);
        showAlert('Transaksi berhasil disimpan!', 'success');

        // Reset form
        transactionForm.reset();
        tanggalInput.valueAsDate = new Date(); // Set tanggal kembali ke hari ini
        produkSelect.value = ""; // Reset pilihan produk
        jumlahInput.value = "1"; // Reset jumlah ke 1
    });
}

// Hanya jalankan kode yang relevan dengan tabel di history.html
if (document.getElementById('tabelTransaksi')) {
    // Muat transaksi saat halaman history.html dimuat
    document.addEventListener('DOMContentLoaded', loadTransactions);

    // Event listener untuk tombol Export PDF
    document.getElementById('btn-pdf').addEventListener('click', function() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
        if (transactions.length === 0) {
            showAlert('Tidak ada data untuk diekspor ke PDF.', 'error');
            return;
        }

        // Menambahkan kolom "Jumlah"
        const tableColumn = ["Tanggal", "Nama", "Produk", "Jumlah", "Bayar", "Status"];
        const tableRows = [];

        transactions.forEach(transaksi => {
            const date = new Date(transaksi.tanggal);
            const formattedDate = date.toLocaleDateString('id-ID', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
            const transactionData = [
                formattedDate,
                transaksi.nama,
                transaksi.produkNama,
                transaksi.jumlah, // Menambahkan jumlah produk
                formatRupiah(transaksi.bayar),
                transaksi.status
            ];
            tableRows.push(transactionData);
        });

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 20,
            headStyles: { fillColor: [46, 134, 193] }, // Warna biru tua
            styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
            columnStyles: {
                0: { cellWidth: 'auto' }, // Tanggal
                1: { cellWidth: 'auto' }, // Nama
                2: { cellWidth: 'auto' }, // Produk
                3: { cellWidth: 'auto' }, // Jumlah (kolom baru)
                4: { cellWidth: 'auto' }, // Bayar
                5: { cellWidth: 'auto' }  // Status
            }
        });

        doc.text("Riwayat Transaksi", 14, 15);
        doc.save('riwayat_transaksi.pdf');
        showAlert('Data berhasil diekspor ke PDF!', 'success');
    });

    // Event listener untuk tombol Export Excel
    document.getElementById('btn-excel').addEventListener('click', function() {
        const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
        if (transactions.length === 0) {
            showAlert('Tidak ada data untuk diekspor ke Excel.', 'error');
            return;
        }

        const data = transactions.map(transaksi => {
            const date = new Date(transaksi.tanggal);
            const formattedDate = date.toLocaleDateString('id-ID', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
            return {
                Tanggal: formattedDate,
                Nama: transaksi.nama,
                Produk: transaksi.produkNama,
                Jumlah: transaksi.jumlah, // Menambahkan jumlah produk
                Bayar: transaksi.bayar,
                Status: transaksi.status
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Riwayat Transaksi");
        XLSX.writeFile(workbook, "riwayat_transaksi.xlsx");
        showAlert('Data berhasil diekspor ke Excel!', 'success');
    });
}
