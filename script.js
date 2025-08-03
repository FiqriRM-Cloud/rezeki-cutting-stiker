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
    console.log('loadTransactions() called.');
    const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    console.log('Transactions loaded from localStorage:', transactions);

    const daftarTransaksi = document.getElementById('daftarTransaksi');
    const totalElement = document.getElementById('total');
    let totalPendapatan = 0;

    daftarTransaksi.innerHTML = ''; // Bersihkan tabel sebelum memuat data baru

    if (transactions.length === 0) {
        console.log('No transactions found.');
        // Mengubah colspan menjadi 7 karena ada kolom "Aksi" baru
        daftarTransaksi.innerHTML = '<tr><td colspan="7" style="text-align: center;">Belum ada transaksi.</td></tr>';
        totalElement.textContent = formatRupiah(0);
        return;
    }

    transactions.forEach((transaksi, index) => {
        console.log('Processing transaction at index', index, ':', transaksi);
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
        row.insertCell(3).textContent = transaksi.jumlah;
        row.insertCell(4).textContent = formatRupiah(transaksi.bayar);

        const statusCell = row.insertCell(5);
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

        // Kolom Aksi
        const actionCell = row.insertCell(6);
        console.log('Checking status for button:', transaksi.status);
        if (transaksi.status.includes('Kurang')) {
            console.log('Status includes "Kurang", adding Bayar Utang button.');
            const payButton = document.createElement('button');
            payButton.textContent = 'Bayar Utang';
            payButton.classList.add('pay-debt-btn'); // Tambahkan kelas untuk styling
            payButton.dataset.index = index; // Simpan indeks transaksi
            payButton.addEventListener('click', () => openPaymentModal(index));
            actionCell.appendChild(payButton);
        } else {
            console.log('Status does NOT include "Kurang", showing hyphen.');
            actionCell.textContent = '-'; // Tidak ada aksi jika tidak berutang
        }

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

// Fungsi untuk menghapus semua transaksi (menggunakan modal kustom)
function clearAllTransactions() {
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
    const jumlahInput = document.getElementById('jumlah');
    const bayarInput = document.getElementById('bayar');

    transactionForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const tanggal = tanggalInput.value;
        const nama = namaInput.value;
        const produkValue = parseInt(produkSelect.value);
        const produkNama = produkSelect.options[produkSelect.selectedIndex].text.split(' - ')[0];
        const jumlah = parseInt(jumlahInput.value);
        const bayar = parseInt(bayarInput.value);

        // Hitung total harga berdasarkan produk dan jumlah
        const totalHargaProduk = produkValue * jumlah;

        let status = '';
        if (bayar < totalHargaProduk) {
            status = `Kurang Rp${formatRupiah(totalHargaProduk - bayar).substring(2)}`;
        } else if (bayar > totalHargaProduk) {
            status = `Lebih Rp${formatRupiah(bayar - totalHargaProduk).substring(2)}`;
        } else {
            status = 'Pas';
        }

        const newTransaction = {
            tanggal: tanggal,
            nama: nama,
            produkNama: produkNama,
            produkHarga: produkValue,
            jumlah: jumlah,
            bayar: bayar,
            status: status
        };

        saveTransaction(newTransaction);
        showAlert('Transaksi berhasil disimpan!', 'success');

        // Reset form
        transactionForm.reset();
        tanggalInput.valueAsDate = new Date();
        produkSelect.value = "";
        jumlahInput.value = "1";
    });
}

// Kode khusus untuk history.html (tabel, export, dan modal pembayaran)
if (document.getElementById('tabelTransaksi')) {
    const paymentModal = document.getElementById('paymentModal');
    const closeButton = document.querySelector('.close-button');
    const savePaymentBtn = document.getElementById('savePaymentBtn');
    const paymentAmountInput = document.getElementById('paymentAmount');
    let currentTransactionIndex = -1; // Untuk menyimpan indeks transaksi yang sedang di-edit

    // Buka modal pembayaran
    function openPaymentModal(index) {
        console.log('openPaymentModal called for index:', index);
        const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
        const transaction = transactions[index];
        
        if (!transaction) {
            console.error('Transaction not found for index:', index);
            return; // Pastikan transaksi ada
        }

        currentTransactionIndex = index;

        // Hitung sisa utang
        const totalHargaProduk = transaction.produkHarga * transaction.jumlah;
        const sisaUtang = totalHargaProduk - transaction.bayar;

        document.getElementById('modalCustomerName').textContent = transaction.nama;
        document.getElementById('modalProductName').textContent = transaction.produkNama;
        document.getElementById('modalDebtAmount').textContent = formatRupiah(sisaUtang);
        paymentAmountInput.value = sisaUtang; // Isi default dengan sisa utang
        paymentModal.style.display = 'flex'; // Tampilkan modal
    }

    // Tutup modal pembayaran
    closeButton.addEventListener('click', () => {
        paymentModal.style.display = 'none';
        paymentAmountInput.value = ''; // Bersihkan input
    });

    // Tutup modal jika klik di luar area modal content
    window.addEventListener('click', (event) => {
        if (event.target === paymentModal) {
            paymentModal.style.display = 'none';
            paymentAmountInput.value = '';
        }
    });

    // Simpan pembayaran utang
    savePaymentBtn.addEventListener('click', () => {
        if (currentTransactionIndex === -1) {
            console.error('No transaction selected for payment.');
            return;
        }

        let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
        let transaction = transactions[currentTransactionIndex];

        const additionalPayment = parseInt(paymentAmountInput.value);

        if (isNaN(additionalPayment) || additionalPayment <= 0) {
            showAlert('Jumlah pembayaran tidak valid!', 'error');
            return;
        }

        transaction.bayar += additionalPayment; // Tambahkan pembayaran baru

        // Hitung ulang status
        const totalHargaProduk = transaction.produkHarga * transaction.jumlah;
        if (transaction.bayar < totalHargaProduk) {
            transaction.status = `Kurang Rp${formatRupiah(totalHargaProduk - transaction.bayar).substring(2)}`;
        } else if (transaction.bayar > totalHargaProduk) {
            transaction.status = `Lebih Rp${formatRupiah(transaction.bayar - totalHargaProduk).substring(2)}`;
        } else {
            transaction.status = 'Pas';
        }

        transactions[currentTransactionIndex] = transaction;
        localStorage.setItem('transactions', JSON.stringify(transactions));

        showAlert('Pembayaran berhasil dicatat!', 'success');
        paymentModal.style.display = 'none';
        paymentAmountInput.value = '';
        loadTransactions(); // Muat ulang tabel untuk menampilkan perubahan
    });

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
        const tableColumn = ["Tanggal", "Nama", "Produk", "Jumlah", "Bayar", "Status"]; // Aksi tidak diekspor
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
                transaksi.jumlah,
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
                3: { cellWidth: 'auto' }, // Jumlah
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
                Jumlah: transaksi.jumlah,
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
