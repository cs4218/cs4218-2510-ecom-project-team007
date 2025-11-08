import json
import matplotlib.pyplot as plt
from cycler import cycler

OUTPUT_FILE = 'results/public/volume-test-results.png'

palette = ['#E69F00', '#56B4E9', '#009E73', '#F0E442',
           '#0072B2', '#D55E00', '#CC79A7', '#000000']

plt.rcParams['axes.prop_cycle'] = cycler(color=palette)

volumes = [10000, 20000, 35000, 50000]
endpoints = ['product-list', 'login', 'product-filters', 'search', 'product-category', 'get-product']
endpoint_labels = ['Product List', 'Login', 'Product Filters', 'Search', 'Product Category', 'Get Single\nProduct']

data = {volume: [] for volume in volumes}

# Extract p95 data for each volume across all endpoints
for volume in volumes:
    with open(f'results/public/summary-{volume}.json', 'r') as f:
        summary = json.load(f)

        for endpoint in endpoints:
            metric = f'http_req_duration{{endpoint:{endpoint}}}'
            p95 = summary['metrics'][metric]['values']['p(95)']
            data[volume].append(p95)

fig, ax = plt.subplots(figsize=(14, 8))

x = list(range(1, len(endpoints) + 1))
markers = ['o', 's', '^', 'D']

for i, volume in enumerate(volumes):
    ax.plot(x, data[volume],
            marker=markers[i],
            linewidth=2.5,
            markersize=10,
            label=f'{volume:,} Products',
            linestyle='-')

# Add threshold line
threshold = 500
ax.axhline(y=threshold, linestyle='--', linewidth=2.5, alpha=0.7, zorder=1,
           label=f'{threshold}ms Threshold')

# Shade acceptable region
ax.fill_between(x, 0, threshold, alpha=0.1, zorder=0)

# Find worst-performing endpoint (highest p95 at max volume)
values = data[volumes[-1]]
index = values.index(max(values))

first_val = data[volumes[0]][index]
last_val = values[index]
degradation = last_val / first_val

ax.annotate(f'Highest response time:\n'
            f'{first_val:.0f}ms → {last_val:.0f}ms\n'
            f'({degradation:.2f}× increase)',
            xy=(index + 1, last_val),
            xytext=(-220, -50),
            textcoords='offset points',
            fontsize=11,
            fontweight='bold',
            bbox=dict(boxstyle='round,pad=0.7', linewidth=2.5, alpha=0.9),
            arrowprops=dict(arrowstyle='->', lw=2.5))

ax.set_xlabel('Endpoint', fontsize=14, fontweight='bold')
ax.set_ylabel('p95 Response Time (ms)', fontsize=14, fontweight='bold')
ax.set_title('Public Endpoint Performance vs Product Volume (50 Concurrent Users)',
             fontsize=15, fontweight='bold', pad=20)

# Hide top/right borders
ax.spines['top'].set_visible(False)
ax.spines['right'].set_visible(False)

ax.set_xticks(x)
ax.set_xticklabels(endpoint_labels, fontsize=12)
ax.set_xlim(0.5, len(endpoints) + 0.5)
ax.set_ylim(bottom=0)

ax.grid(True, alpha=0.3, linestyle='--')
ax.legend(loc='upper left', fontsize=11, framealpha=0.95)

plt.tight_layout()
plt.savefig(OUTPUT_FILE, dpi=300, bbox_inches='tight')
print(f'Chart saved to ${OUTPUT_FILE}')
plt.show()
