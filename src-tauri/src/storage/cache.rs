use lru::LruCache;
use std::num::NonZeroUsize;

/// LRU cache for recent block output
pub struct BlockCache {
    cache: LruCache<String, Vec<u8>>,
}

impl BlockCache {
    pub fn new(capacity: usize) -> Self {
        Self {
            cache: LruCache::new(NonZeroUsize::new(capacity).unwrap_or(NonZeroUsize::new(30).unwrap())),
        }
    }

    pub fn get(&mut self, block_id: &str) -> Option<&Vec<u8>> {
        self.cache.get(block_id)
    }

    pub fn put(&mut self, block_id: String, data: Vec<u8>) {
        self.cache.put(block_id, data);
    }

    pub fn remove(&mut self, block_id: &str) {
        self.cache.pop(block_id);
    }

    pub fn clear(&mut self) {
        self.cache.clear();
    }
}
