use serde::Serialize;
use sysinfo::{System, Disks};

#[derive(Serialize)]
pub struct SystemMetrics {
    pub cpu_usage: f32,
    pub memory_used: u64,
    pub memory_total: u64,
    pub swap_used: u64,
    pub swap_total: u64,
    pub cpu_count: usize,
    pub disk_used: u64,
    pub disk_total: u64,
    pub uptime: u64,
}

#[tauri::command]
pub async fn get_system_metrics() -> Result<SystemMetrics, String> {
    let mut sys = System::new();
    sys.refresh_cpu_usage();
    // sysinfo precisa de intervalo entre refreshes para medir CPU
    tokio::time::sleep(tokio::time::Duration::from_millis(200)).await;
    sys.refresh_cpu_usage();
    sys.refresh_memory();

    // Disco: somar todos os discos
    let disks = Disks::new_with_refreshed_list();
    let mut disk_total: u64 = 0;
    let mut disk_available: u64 = 0;
    for disk in disks.list() {
        disk_total += disk.total_space();
        disk_available += disk.available_space();
    }

    Ok(SystemMetrics {
        cpu_usage: sys.global_cpu_usage(),
        memory_used: sys.used_memory(),
        memory_total: sys.total_memory(),
        swap_used: sys.used_swap(),
        swap_total: sys.total_swap(),
        cpu_count: sys.cpus().len(),
        disk_used: disk_total.saturating_sub(disk_available),
        disk_total,
        uptime: System::uptime(),
    })
}
