export class SourceProvenanceGraph {
  #sources = new Map();
  #parents = new Map();

  addSource({ id, type = 'secondary', jurisdiction = null, authority = null, publishedAt = null, metadata = {} }) {
    if (!id) throw new Error('source id is required');
    if (this.#sources.has(id)) throw new Error(`source already exists: ${id}`);
    const source = { id, type, jurisdiction, authority, publishedAt, metadata: structuredClone(metadata) };
    this.#sources.set(id, source);
    this.#parents.set(id, []);
    return structuredClone(source);
  }

  derive({ sourceId, fromSourceId, relation = 'derives-from' }) {
    this.#require(sourceId);
    this.#require(fromSourceId);
    if (sourceId === fromSourceId) throw new Error('source cannot derive from itself');
    const parents = this.#parents.get(sourceId);
    parents.push({ sourceId: fromSourceId, relation });
    if (this.#reachable(fromSourceId, sourceId)) {
      parents.pop();
      throw new Error('provenance cycle detected');
    }
  }

  roots(sourceId) {
    this.#require(sourceId);
    const roots = new Set();
    const visit = (id, seen = new Set()) => {
      if (seen.has(id)) return;
      seen.add(id);
      const parents = this.#parents.get(id) ?? [];
      if (parents.length === 0) roots.add(id);
      for (const parent of parents) visit(parent.sourceId, seen);
    };
    visit(sourceId);
    return [...roots].sort();
  }

  independence(sourceIds) {
    const ids = [...new Set(sourceIds)];
    ids.forEach(id => this.#require(id));
    const lineages = ids.map(id => ({ sourceId: id, roots: this.roots(id) }));
    const roots = [...new Set(lineages.flatMap(item => item.roots))];
    return {
      citedSources: ids.length,
      independentRoots: roots.length,
      independenceScore: ids.length ? roots.length / ids.length : 0,
      roots: roots.sort(),
      lineages,
    };
  }

  weightForDecision(sourceIds) {
    const report = this.independence(sourceIds);
    const primaryRoots = report.roots.filter(id => this.#sources.get(id)?.type === 'primary');
    return {
      ...report,
      primaryRootCount: primaryRoots.length,
      evidenceWeight: report.independentRoots === 0 ? 0 : Math.min(1, (primaryRoots.length * 1.5 + (report.independentRoots - primaryRoots.length)) / Math.max(1, report.citedSources)),
    };
  }

  #reachable(start, target) {
    const stack = [start];
    const seen = new Set();
    while (stack.length) {
      const id = stack.pop();
      if (id === target) return true;
      if (seen.has(id)) continue;
      seen.add(id);
      for (const parent of this.#parents.get(id) ?? []) stack.push(parent.sourceId);
    }
    return false;
  }

  #require(id) {
    const source = this.#sources.get(id);
    if (!source) throw new Error(`unknown source: ${id}`);
    return source;
  }
}
