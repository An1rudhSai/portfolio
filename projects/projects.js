import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import { fetchJSON, renderProjects } from '../global.js';

const projects = await fetchJSON('../lib/projects.json');

const projectsContainer = document.querySelector('.projects');

renderProjects(projects, projectsContainer, 'h2');

// Step 1.6: count of projects in the page title
const projectsTitle = document.querySelector('.projects-title');

if (projectsTitle) {
  projectsTitle.textContent = `${projects?.length ?? 0} Projects`;
}

// Lab 5: pie chart of projects per year, search, and filtering by wedge
let query = '';
let selectedIndex = -1;
let selectedYear = null; // label of the selected wedge, kept so the search can respect it

let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
let colors = d3.scaleOrdinal(d3.schemeTableau10);

// Step 4.3: case-insensitive search across all project metadata
function searchProjects() {
  return projects.filter((project) => {
    let values = Object.values(project).join('\n').toLowerCase();
    return values.includes(query.toLowerCase());
  });
}

// Step 5.4 fix: apply the search query and the selected year together,
// instead of filtering the full project list by only one of them.
function visibleProjects() {
  let searched = searchProjects();
  return selectedYear === null
    ? searched
    : searched.filter((project) => project.year === selectedYear);
}

// Step 4.4: all plotting in one function, called on load and on every search
function renderPieChart(projectsGiven) {
  let newRolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year,
  );
  let newData = newRolledData.map(([year, count]) => {
    return { value: count, label: year };
  });
  let newSliceGenerator = d3.pie().value((d) => d.value);
  let newArcData = newSliceGenerator(newData);
  let newArcs = newArcData.map((d) => arcGenerator(d));

  // Keep the selected year highlighted if it is still in the searched data
  selectedIndex = newData.findIndex((d) => d.label === selectedYear);
  if (selectedIndex === -1) selectedYear = null;

  let svg = d3.select('#projects-pie-plot');
  let legend = d3.select('.legend');
  svg.selectAll('path').remove();
  legend.selectAll('li').remove();

  function selectWedge(i) {
    selectedIndex = selectedIndex === i ? -1 : i;
    selectedYear = selectedIndex === -1 ? null : newData[selectedIndex].label;

    svg
      .selectAll('path')
      .attr('class', (_, idx) => (idx === selectedIndex ? 'selected' : ''));
    legend
      .selectAll('li')
      .attr('class', (_, idx) => (idx === selectedIndex ? 'legend-item selected' : 'legend-item'));

    renderProjects(visibleProjects(), projectsContainer, 'h2');
  }

  newArcs.forEach((arc, i) => {
    svg
      .append('path')
      .attr('d', arc)
      .attr('fill', colors(i))
      .attr('class', i === selectedIndex ? 'selected' : '')
      .on('click', () => selectWedge(i));
  });

  newData.forEach((d, idx) => {
    legend
      .append('li')
      .attr('style', `--color:${colors(idx)}`)
      .attr('class', idx === selectedIndex ? 'legend-item selected' : 'legend-item')
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
      .on('click', () => selectWedge(idx));
  });
}

renderPieChart(projects);

let searchInput = document.querySelector('.searchBar');

searchInput.addEventListener('input', (event) => {
  query = event.target.value;
  renderPieChart(searchProjects());
  renderProjects(visibleProjects(), projectsContainer, 'h2');
});
