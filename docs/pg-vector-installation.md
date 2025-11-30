# Installing pgvector on PostgreSQL using WSL (Recommended)

This guide shows how to install PostgreSQL + pgvector inside **WSL (Ubuntu)**, which is MUCH easier and avoids Windows build errors.

---

## 1. Install WSL + Ubuntu

Open PowerShell as Administrator:

```powershell
wsl --install -d Ubuntu
```

Reboot if required.

---

## 2. Update Ubuntu

```bash
sudo apt update && sudo apt upgrade -y
```

---

## 3. Install PostgreSQL

```bash
sudo apt install -y postgresql postgresql-contrib
```

Start the PostgreSQL service:

```bash
sudo service postgresql start
```

---

## 4. Install pgvector (works automatically on Linux)

```bash
sudo apt install -y postgresql-16-pgvector
```

> If your PostgreSQL version is not 16, replace `16` accordingly.

---

## 5. Enable pgvector in PostgreSQL

Switch to postgres user:

```bash
sudo -i -u postgres
```

Enter psql:

```bash
psql
```

Enable extension:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

Check if installed:

```sql
\dx
```

You should see:

```
vector | 0.x.x | public | vector data type and ivfflat index
```

---

## 6. Test pgvector

```sql
CREATE TABLE items (id bigserial, embedding vector(3));

INSERT INTO items (embedding) VALUES ('[1,2,3]');
SELECT * FROM items;
```

---

## 7. Connect from Windows to PostgreSQL inside WSL

Find WSL IP:

```bash
hostname -I
```

Use that IP in your Windows GUI (TablePlus, DBeaver, etc.):

```
Host: <WSL IP>
Port: 5432
User: postgres
Password: <your_pass>
```

---

## Done!

You now have PostgreSQL + pgvector running the easiest, cleanest, and most stable way on Windows (through WSL).
