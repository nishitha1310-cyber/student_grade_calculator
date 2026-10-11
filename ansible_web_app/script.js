const form = document.getElementById("playbookForm");
const taskType = document.getElementById("taskType");
const taskOptions = document.getElementById("taskOptions");
const output = document.getElementById("output");
const message = document.getElementById("message");

let generated = "";

function renderTaskOptions() {
  if (taskType.value === "install") {
    taskOptions.innerHTML = `
      <label for="packageName">Package Name</label>
      <input id="packageName" value="nginx"
             pattern="[A-Za-z0-9_.+-]+" required>
    `;
  } else if (taskType.value === "service") {
    taskOptions.innerHTML = `
      <label for="serviceName">Service Name</label>
      <input id="serviceName" value="nginx"
             pattern="[A-Za-z0-9_.@-]+" required>
      <label for="serviceState">Service Action</label>
      <select id="serviceState">
        <option value="started">Start</option>
        <option value="stopped">Stop</option>
        <option value="restarted">Restart</option>
      </select>
    `;
  } else if (taskType.value === "directory") {
    taskOptions.innerHTML = `
      <label for="directoryPath">Directory Path</label>
      <input id="directoryPath" value="/opt/myapp"
             pattern="/[A-Za-z0-9_./-]+" required>
    `;
  } else {
    taskOptions.innerHTML =
      '<p class="muted">Refresh the package cache on supported hosts.</p>';
  }
}

function generatePlaybook() {
  const name = document.getElementById("playName").value.trim();
  const hosts = document.getElementById("hosts").value.trim();
  const become = document.getElementById("become").value;

  if (!name || !hosts) {
    throw new Error("Enter a playbook name and target hosts.");
  }

  const lines = [
    "---",
    "- name: " + JSON.stringify(name),
    "  hosts: " + hosts,
    "  become: " + become,
    "  tasks:"
  ];

  if (taskType.value === "install") {
    const pkg = document.getElementById("packageName").value.trim();
    if (!pkg) throw new Error("Enter a package name.");

    lines.push(
      "    - name: Install package",
      "      ansible.builtin.package:",
      "        name: " + JSON.stringify(pkg),
      "        state: present"
    );
  } else if (taskType.value === "service") {
    const service = document.getElementById("serviceName").value.trim();
    const state = document.getElementById("serviceState").value;
    if (!service) throw new Error("Enter a service name.");

    lines.push(
      "    - name: Manage service",
      "      ansible.builtin.service:",
      "        name: " + JSON.stringify(service),
      "        state: " + state
    );
  } else if (taskType.value === "directory") {
    const path = document.getElementById("directoryPath").value.trim();
    if (!path) throw new Error("Enter a directory path.");

    lines.push(
      "    - name: Create directory",
      "      ansible.builtin.file:",
      "        path: " + JSON.stringify(path),
      "        state: directory",
      "        mode: '0755'"
    );
  } else {
    lines.push(
      "    - name: Update package cache",
      "      ansible.builtin.apt:",
      "        update_cache: true",
      "      when: ansible_os_family == 'Debian'"
    );
  }

  generated = lines.join("\n") + "\n";
  output.textContent = generated;
  message.textContent = "Playbook generated successfully!";
}

taskType.addEventListener("change", () => {
  renderTaskOptions();
  message.textContent = "";
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  message.textContent = "";

  if (!form.reportValidity()) return;

  try {
    generatePlaybook();
  } catch (error) {
    message.textContent = error.message;
  }
});

document.getElementById("copyBtn").addEventListener("click", async () => {
  if (!generated) {
    message.textContent = "Generate a playbook first.";
    return;
  }

  try {
    await navigator.clipboard.writeText(generated);
    message.textContent = "YAML copied successfully!";
  } catch {
    message.textContent = "Clipboard unavailable. Copy the YAML manually.";
  }
});

document.getElementById("downloadBtn").addEventListener("click", () => {
  if (!generated) {
    message.textContent = "Generate a playbook first.";
    return;
  }

  const blob = new Blob([generated], { type: "text/yaml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "site.yml";
  link.click();

  URL.revokeObjectURL(url);
  message.textContent = "Playbook download requested!";
});

renderTaskOptions();