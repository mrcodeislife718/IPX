import test from 'node:test';
import assert from 'node:assert/strict';
import { SourceProvenanceGraph } from '../src/source-provenance.js';

test('weights independent primary roots instead of derivative citation count', () => {
  const graph = new SourceProvenanceGraph();
  graph.addSource({ id: 'patent-a', type: 'primary' });
  graph.addSource({ id: 'patent-b', type: 'primary' });
  graph.addSource({ id: 'article-a' });
  graph.addSource({ id: 'article-b' });
  graph.derive({ sourceId: 'article-a', fromSourceId: 'patent-a' });
  graph.derive({ sourceId: 'article-b', fromSourceId: 'article-a' });
  const report = graph.weightForDecision(['patent-a', 'patent-b', 'article-a', 'article-b']);
  assert.equal(report.citedSources, 4);
  assert.equal(report.independentRoots, 2);
  assert.equal(report.primaryRootCount, 2);
  assert.equal(report.independenceScore, 0.5);
});
