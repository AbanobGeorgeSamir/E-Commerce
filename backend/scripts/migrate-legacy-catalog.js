require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { connectDB } = require('../config/db');
const Category = require('../models/Category');
const Product = require('../models/Product');

const dumpPath = path.join(__dirname, '..', '..', 'ecommerce_db.sql');

const parseSqlValue = (rawValue) => {
    const value = rawValue.trim();
    if (value.toUpperCase() === 'NULL') return null;
    if (value.startsWith("'") && value.endsWith("'")) {
        return value
            .slice(1, -1)
            .replace(/''/g, "'")
            .replace(/\\'/g, "'")
            .replace(/\\\\/g, '\\');
    }

    const number = Number(value);
    return Number.isNaN(number) ? value : number;
};

const splitSqlValues = (row) => {
    const values = [];
    let start = 0;
    let inString = false;

    for (let index = 0; index < row.length; index += 1) {
        const character = row[index];
        if (character === "'") {
            if (inString && row[index + 1] === "'") {
                index += 1;
                continue;
            }
            if (row[index - 1] !== '\\') inString = !inString;
        } else if (character === ',' && !inString) {
            values.push(parseSqlValue(row.slice(start, index)));
            start = index + 1;
        }
    }

    values.push(parseSqlValue(row.slice(start)));
    return values;
};

const extractRows = (sql, tableName) => {
    const match = sql.match(new RegExp(
        'INSERT INTO \\x60' + tableName + '\\x60 \\(([^)]+)\\) VALUES\\s*([\\s\\S]*?);',
        'i'
    ));
    if (!match) return [];

    const columns = match[1].split(',').map((column) => column.replace(/[\x60\s]/g, ''));
    const rows = [];
    const valuesPart = match[2];
    let inString = false;
    let depth = 0;
    let rowStart = -1;

    for (let index = 0; index < valuesPart.length; index += 1) {
        const character = valuesPart[index];
        if (character === "'") {
            if (inString && valuesPart[index + 1] === "'") {
                index += 1;
                continue;
            }
            if (valuesPart[index - 1] !== '\\') inString = !inString;
            continue;
        }

        if (inString) continue;
        if (character === '(') {
            if (depth === 0) rowStart = index + 1;
            depth += 1;
        } else if (character === ')') {
            depth -= 1;
            if (depth === 0 && rowStart >= 0) {
                const values = splitSqlValues(valuesPart.slice(rowStart, index));
                rows.push(Object.fromEntries(columns.map((column, columnIndex) => [column, values[columnIndex]])));
                rowStart = -1;
            }
        }
    }

    return rows;
};

const validDate = (value) => {
    if (!value) return undefined;
    const date = new Date(String(value).replace(' ', 'T') + 'Z');
    return Number.isNaN(date.getTime()) ? undefined : date;
};

const findExistingImage = (legacyPath) => {
    if (!legacyPath) return null;
    return fs.existsSync(path.join(__dirname, '..', 'public', legacyPath)) ? legacyPath : null;
};

const migrate = async () => {
    if (!fs.existsSync(dumpPath)) {
        throw new Error('Legacy SQL dump was not found at ' + dumpPath);
    }

    await connectDB();
    const sql = fs.readFileSync(dumpPath, 'utf8');
    const categoryIdMap = new Map();
    let categoriesCreated = 0;
    let productsCreated = 0;

    for (const legacyCategory of extractRows(sql, 'categories')) {
        const existing = await Category.findOne({ slug: legacyCategory.slug });
        const category = existing || await Category.create({
            name: legacyCategory.name,
            slug: legacyCategory.slug,
            image: findExistingImage(legacyCategory.image),
            createdAt: validDate(legacyCategory.created_at),
            updatedAt: validDate(legacyCategory.updated_at),
        });
        if (!existing) categoriesCreated += 1;
        categoryIdMap.set(String(legacyCategory.id), category._id);
    }

    for (const legacyProduct of extractRows(sql, 'products')) {
        const existing = await Product.findOne({ slug: legacyProduct.slug });
        if (!existing) {
            await Product.create({
                name: legacyProduct.name,
                slug: legacyProduct.slug,
                description: legacyProduct.description || '',
                price: Number(legacyProduct.price),
                stock: Number(legacyProduct.stock) || 0,
                image: findExistingImage(legacyProduct.image),
                category: categoryIdMap.get(String(legacyProduct.category_id)) || null,
                createdAt: validDate(legacyProduct.created_at),
                updatedAt: validDate(legacyProduct.updated_at),
            });
            productsCreated += 1;
        }
    }

    console.log('Migration complete: ' + categoriesCreated + ' categories and ' + productsCreated + ' products created.');
};

migrate()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error.message);
        process.exit(1);
    });
