const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

class InMemoryCollection {
  constructor(name) {
    this.name = name;
    this.docs = [];
  }

  _clone(doc) {
    return JSON.parse(JSON.stringify(doc));
  }

  _matchesQuery(doc, query = {}) {
    for (const key of Object.keys(query)) {
      const val = query[key];

      if (key === '$or' && Array.isArray(val)) {
        const anyMatch = val.some((subQuery) => this._matchesQuery(doc, subQuery));
        if (!anyMatch) return false;
        continue;
      }

      if (val && typeof val === 'object' && !Array.isArray(val)) {
        if ('$in' in val && Array.isArray(val.$in)) {
          if (!val.$in.includes(doc[key])) return false;
          continue;
        }
        if ('$nin' in val && Array.isArray(val.$nin)) {
          if (val.$nin.includes(doc[key])) return false;
          continue;
        }
      }

      // Handle nested property path like 'data.certificateId'
      if (key.includes('.')) {
        const parts = key.split('.');
        let curr = doc;
        for (const p of parts) {
          curr = curr ? curr[p] : undefined;
        }
        if (curr !== val) return false;
        continue;
      }

      if (doc[key] !== val) {
        
        if (String(doc[key]) !== String(val)) {
          return false;
        }
      }
    }
    return true;
  }

  async find(query = {}) {
    const results = this.docs.filter((d) => this._matchesQuery(d, query)).map((d) => this._attachDocMethods(this._clone(d)));
    return new QueryChain(results);
  }

  async findOne(query = {}) {
    const doc = this.docs.find((d) => this._matchesQuery(d, query));
    return doc ? this._attachDocMethods(this._clone(doc)) : null;
  }

  async findById(id) {
    return this.findOne({ _id: id });
  }

  async create(data) {
    const id = data._id || data.id || 'id_' + crypto.randomBytes(12).toString('hex');
    const doc = {
      _id: id,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data,
    };
    this.docs.push(doc);
    return this._attachDocMethods(this._clone(doc));
  }

  async findOneAndUpdate(query, update, options = {}) {
    let index = this.docs.findIndex((d) => this._matchesQuery(d, query));
    if (index === -1) {
      if (options.upsert) {
        const newDoc = {
          _id: 'id_' + crypto.randomBytes(12).toString('hex'),
          ...query,
          ...update,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        this.docs.push(newDoc);
        return this._attachDocMethods(this._clone(newDoc));
      }
      return null;
    }

    const updated = {
      ...this.docs[index],
      ...update,
      updatedAt: new Date(),
    };
    this.docs[index] = updated;
    return this._attachDocMethods(this._clone(updated));
  }

  async countDocuments(query = {}) {
    return this.docs.filter((d) => this._matchesQuery(d, query)).length;
  }

  async distinct(field, query = {}) {
    const matched = this.docs.filter((d) => this._matchesQuery(d, query));
    const set = new Set(matched.map((d) => d[field]).filter(Boolean));
    return Array.from(set);
  }

  async deleteMany(query = {}) {
    const initial = this.docs.length;
    if (Object.keys(query).length === 0) {
      this.docs = [];
      return { deletedCount: initial };
    }
    this.docs = this.docs.filter((d) => !this._matchesQuery(d, query));
    return { deletedCount: initial - this.docs.length };
  }

  _attachDocMethods(doc) {
    const self = this;
    doc.save = async function () {
      const idx = self.docs.findIndex((d) => d._id === doc._id || d.id === doc.id);
      if (idx !== -1) {
        doc.updatedAt = new Date();
        self.docs[idx] = { ...doc };
      } else {
        self.docs.push({ ...doc });
      }
      return self._attachDocMethods(self._clone(doc));
    };

    doc.comparePassword = async function (enteredPassword) {
      if (!this.passwordHash) return false;
      return await bcrypt.compare(enteredPassword, this.passwordHash);
    };

    return doc;
  }
}

class QueryChain {
  constructor(results) {
    this.results = results;
  }

  sort(criteria) {
    if (typeof criteria === 'object') {
      const field = Object.keys(criteria)[0];
      const dir = criteria[field]; // 1 or -1
      this.results.sort((a, b) => {
        const valA = a[field] ?? 0;
        const valB = b[field] ?? 0;
        if (valA < valB) return dir === -1 ? 1 : -1;
        if (valA > valB) return dir === -1 ? -1 : 1;
        return 0;
      });
    }
    return this;
  }

  skip(n) {
    this.results = this.results.slice(n);
    return this;
  }

  limit(n) {
    this.results = this.results.slice(0, n);
    return this;
  }

  select() {
    return this;
  }

  populate() {
    return this;
  }

  then(resolve, reject) {
    return Promise.resolve(this.results).then(resolve, reject);
  }
}

// Global Memory Store instance
const collections = {
  User: new InMemoryCollection('User'),
  Institution: new InMemoryCollection('Institution'),
  Certificate: new InMemoryCollection('Certificate'),
  VerificationVote: new InMemoryCollection('VerificationVote'),
  AuditLog: new InMemoryCollection('AuditLog'),
  Block: new InMemoryCollection('Block'),
};

function getModel(name) {
  const col = collections[name];
  function ModelConstructor(data = {}) {
    const id = data._id || data.id || 'id_' + crypto.randomBytes(12).toString('hex');
    const doc = {
      _id: id,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data,
    };
    return col._attachDocMethods(doc);
  }

  ModelConstructor.find = (q) => col.find(q);
  ModelConstructor.findOne = (q) => col.findOne(q);
  ModelConstructor.findById = (id) => col.findById(id);
  ModelConstructor.create = (d) => col.create(d);
  ModelConstructor.findOneAndUpdate = (q, u, o) => col.findOneAndUpdate(q, u, o);
  ModelConstructor.countDocuments = (q) => col.countDocuments(q);
  ModelConstructor.distinct = (f, q) => col.distinct(f, q);
  ModelConstructor.deleteMany = (q) => col.deleteMany(q);

  return ModelConstructor;
}

module.exports = {
  getModel,
  collections,
};
