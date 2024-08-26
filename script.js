function encodeCredentials(username, password) {
    return btoa(`${username}:${password}`);
}

async function fetchPatientData() {
    const apiUrl = "https://fedskillstest.coalitiontechnologies.workers.dev";
    const credentials = encodeCredentials("coalition", "skills-test");

    try {
        const response = await fetch(apiUrl, {
            method: "GET",
            headers: {
                Authorization: `Basic ${credentials}`,
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching patient data:", error);
    }
}

async function populateUI() {
    const data = await fetchPatientData();

    if (!data) {
        console.error("Patient data is undefined or null");
        return;
    }

    const patientsElement = document.getElementById("patients");
    patientsElement.innerHTML = `
        <h3 class="box-heading">All Patients</h3>
        ${data
            .map(
                (patient, index) => `<div class="flex-row list-box patient-item" data-index="${index}">
                    <img src="${patient.profile_picture}" class="pic-small" />
                    <div class="flex-col">
                        <span>${patient.name}</span>
                        <span class="text-grey">${patient.gender}, ${patient.age}</span>
                    </div>
                </div>`
            )
            .join("")}
    `;

    const patientItems = document.querySelectorAll(".patient-item");
    patientItems.forEach((item) => {
        item.addEventListener("click", (e) => {
            const patientIndex = e.currentTarget.getAttribute("data-index");
            updatePatientDetails(data[patientIndex]);
        });
    });

    updatePatientDetails(data[0]);
}

function updatePatientDetails(patient) {
    const profileElement = document.getElementById("profile");
    profileElement.innerHTML = `
        <h3 class="box-heading">Profile</h3>
        <img src="${patient.profile_picture || "default-image-url.jpg"}" alt="Profile Picture of ${patient.name}">
        <p>Name: ${patient.name}</p>
        <p>Gender: ${patient.gender}</p>
        <p>Phone: ${patient.phone_number}</p>
        <p>Date of Birth: ${new Date(patient.date_of_birth).toLocaleDateString()}</p>
        <p>Insurance: ${patient.insurance_type}</p>
    `;

    const historyElement = document.getElementById("history");
    historyElement.innerHTML = `<h3 class="box-heading">Diagnosis History</h3><canvas id="historyChart"></canvas>`;
    const ctx = document.getElementById("historyChart").getContext("2d");

    if (patient.diagnosis_history && patient.diagnosis_history.length > 0) {
        new Chart(ctx, {
            type: "line",
            data: {
                labels: patient.diagnosis_history.map(
                    (entry) => `${entry.month} ${entry.year}`
                ),
                datasets: [
                    {
                        label: "Systolic Blood Pressure",
                        data: patient.diagnosis_history.map(
                            (entry) => entry.blood_pressure.systolic.value
                        ),
                        borderColor: "rgba(255, 99, 132, 1)",
                        backgroundColor: "rgba(255, 99, 132, 0.2)",
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: "Diastolic Blood Pressure",
                        data: patient.diagnosis_history.map(
                            (entry) => entry.blood_pressure.diastolic.value
                        ),
                        borderColor: "rgba(54, 162, 235, 1)",
                        backgroundColor: "rgba(54, 162, 235, 0.2)",
                        fill: true,
                        tension: 0.4
                    },
                ],
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: "rgba(200, 200, 200, 0.3)"
                        }
                    },
                    x: {
                        grid: {
                            color: "rgba(200, 200, 200, 0.3)"
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: '#333'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: 'rgba(0, 0, 0, 0.7)',
                        borderWidth: 1
                    }
                }
            },
        });

        const latestEntry = patient.diagnosis_history[0];
        const squareContainer = document.createElement("div");
        squareContainer.className = "flex-row";

        const respiratoryRateBox = document.createElement("div");
        respiratoryRateBox.innerHTML = `
            <div class="square-box">
                <img class="square-icon" src="./assets/respiratory_rate.svg" />
                <p class="square-heading">Respiratory Rate:</p>
                <p>${latestEntry.respiratory_rate.value}</p> 
                <p>${latestEntry.respiratory_rate.levels}</p>
            </div>
        `;
        squareContainer.appendChild(respiratoryRateBox);

        const temperatureBox = document.createElement("div");
        temperatureBox.innerHTML = `
            <div class="square-box">
                <img class="square-icon" src="/assets/temperature.svg" />
                <p class="square-heading">Temperature:</p>
                <p>${latestEntry.temperature.value}°F</p> 
                <p>${latestEntry.temperature.levels}</p>
            </div>
        `;
        squareContainer.appendChild(temperatureBox);

        const heartRateBox = document.createElement("div");
        heartRateBox.innerHTML = `
            <div class="square-box">
                <img class="square-icon" src="./assets/HeartBPM.svg" />
                <p class="square-heading">Heart Rate:</p>
                <p>${latestEntry.heart_rate.value}</p> 
                <p>${latestEntry.heart_rate.levels}</p>
            </div>
        `;
        squareContainer.appendChild(heartRateBox);

        historyElement.appendChild(squareContainer);
    } else {
        ctx.canvas.parentNode.innerHTML = "<p>No blood pressure data available</p>";
    }

    const listElement = document.getElementById("list");
    if (patient.diagnostic_list && patient.diagnostic_list.length > 0) {
        listElement.innerHTML = `
            <h3 class="box-heading">Diagnostic List</h3>
            <table>
                <thead>
                    <tr>
                        <th>Problem</th>
                        <th>Description</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${patient.diagnostic_list
                        .map(
                            (diag) => `
                            <tr>
                                <td>${diag.name}</td>
                                <td>${diag.description}</td>
                                <td>${diag.status}</td>
                            </tr>
                        `
                        )
                        .join("")}
                </tbody>
            </table>
        `;
    } else {
        listElement.innerHTML = "<p>No diagnostics data available</p>";
    }

    const resultsElement = document.getElementById("results");
    if (patient.lab_results && patient.lab_results.length > 0) {
        resultsElement.innerHTML = `
            <h3 class="box-heading">Lab Results</h3>
            ${patient.lab_results
                .map((result) => {
                    return `<div class="list-box">${result}</div>`;
                })
                .join("")}
        `;
    } else {
        resultsElement.innerHTML += "<p>No results available</p>";
    }
}

populateUI();
