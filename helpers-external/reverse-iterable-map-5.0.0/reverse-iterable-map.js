"use strict";

class ReverseIterableMap {
	constructor(e) {
		if (this._map = new Map, this._firstNode = null, this._lastNode = null, void 0 !== e)
			for (const t of e) {
				if (!Array.isArray(t)) throw new TypeError("iterable for Map should have array-like objects");
				this.set(t[0], t[1])
			}
	}
	get[Symbol.toStringTag]() {
		return "ReverseIterableMap"
	}
	get size() {
		return this._map.size
	}
	clear() {
		this._map.clear(), this._firstNode = null, this._lastNode = null
	}
	has(e) {
		return this._map.has(e)
	}
	get(e) {
		const t = this._map.get(e);
		return void 0 !== t ? t.value : void 0
	}
	_updateExistingNode(e, t) {
		const r = this._map.get(e);
		return void 0 !== r && (r.value = t, !0)
	}
	set(e, t) {
		if (this._updateExistingNode(e, t)) return this;
		const s = new rimpr(e, t);
		return this._map.set(e, s), null !== this._lastNode && (s.prevNode = this._lastNode, this._lastNode.nextNode = s), null === this._firstNode && (this._firstNode = s), this._lastNode = s, this
	}
	setFirst(e, t) {
		if (this._updateExistingNode(e, t)) return this;
		const s = new rimpr(e, t);
		return this._map.set(e, s), null !== this._firstNode && (s.nextNode = this._firstNode, this._firstNode.prevNode = s), null === this._lastNode && (this._lastNode = s), this._firstNode = s, this
	}
	delete(e) {
		const t = this._map.get(e);
		return void 0 !== t && (null !== t.prevNode && null !== t.nextNode ? (t.prevNode.nextNode = t.nextNode, t.nextNode.prevNode = t.prevNode) : null !== t.prevNode ? (t.prevNode.nextNode = null, this._lastNode = t.prevNode) : null !== t.nextNode ? (t.nextNode.prevNode = null, this._firstNode = t.nextNode) : (this._firstNode = null, this._lastNode = null), this._map.delete(e))
	}
	forEach(e, t) {
		for (const [r, s] of this.entries()) e.call(t, s, r, this)
	}
	forEachReverse(e, t) {
		for (const [r, s] of this.entries().reverseIterator()) e.call(t, s, r, this)
	}[Symbol.iterator]() {
		return this.entries()
	}
	reverseIterator() {
		return this.entries().reverseIterator()
	}
	entries() {
		return this._iterableIterator((e => [e.key, e.value]))
	}
	keys() {
		return this._iterableIterator((e => e.key))
	}
	values() {
		return this._iterableIterator((e => e.value))
	}
	iteratorFor(e) {
		let t = this._map.get(e);
		return this._iterableIterator((e => [e.key, e.value]), t)
	}
	_iterableIterator(e, t) {
		const r = this._lastNode;
		let s = void 0 !== t ? t : this._firstNode,
			i = !0;
		return {
			reverseIterator() {
				return s = void 0 !== t ? t : r, i = !1, this
			},
			[Symbol.iterator]() {
				return this
			},
			next() {
				let t;
				return null !== s && (t = e(s), s = i ? s.nextNode : s.prevNode),
					function(e) {
						return {
							value: e,
							done: void 0 === e
						}
					}(t)
			}
		}
	}
}
class rimpr {
	constructor(e, t) {
		this.key = e, this.value = t, this.prevNode = null, this.nextNode = null
	}
}