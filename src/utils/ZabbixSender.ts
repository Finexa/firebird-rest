import * as Net from 'net';
import { Buffer } from 'buffer';

export type Item = {
    host?: string;
    key: string;
    value: string;
    clock?: number;
    ns?: number;
};

export type Options = {
    host?: string;
    port?: number;
    timeout?: number;
    withTimeStamp?: boolean;
    agentHost?: string;
    withNs?: boolean;
};

/**
 * Zabbix sender class
 */
export class ZabbixSender {
    private _serverHost: string;
    private _serverPort: number;
    private _timeout: number;
    private _withTimestamps: boolean;
    private _withNs: boolean;
    public _agentHost: string;
    private items: Item[] = [];

    constructor(options: Options) {
        // Check if the `options` parameter is defined or not using the `typeof` operator
        // If `options` is not defined, set it to an empty object using a ternary operator
        options = (typeof options !== 'undefined') ? options : {};

        this._serverHost = options.host || 'localhost';
        this._serverPort = options.port || 10051;
        this._timeout = options.timeout || 5000;
        this._withNs = options.withNs || false;
        this._withTimestamps = options.withTimeStamp || false;
        this._agentHost = options.agentHost || ' ';

        this.clearItems();
    }

    /**
     * Clear the items array
     */
    public clearItems() {
        this.items = [];
    }

    /**
     * Adds an item to the internal `items` array with the specified key, value, and optional host.
     * The item will also include a timestamp if `_withTimestamps` is set to true.
     *
     * @public
     * @param {string} key - The key associated with the item.
     * @param {any} value - The value to be associated with the item.
     * @param {string} [host] - The host associated with the item (optional). If not provided, it will default to `_agentHost`.
     * @returns {void}
     */
    public addItem(key: string, value, host?: string) {
        if (typeof host === 'undefined') {
            host = this._agentHost;
        }

        const item: Item = {
            host: host,
            key: key,
            value: value,
        };

        const length = this.items.push(item);

        if (this._withTimestamps) {
            this.items[length - 1]['clock'] = Date.now() / 1000 | 0;
        }
    }

    /**
     * Sends the items to the Zabbix server via a TCP socket. The response is returned via the provided callback function.
     * If an error occurs or the response is invalid, the items are added back to the internal `items` array.
     *
     * @public
     * @param {function} [callback] - The callback function to handle the server's response (optional). If not provided, an empty function is used.
     * @param {Error | null} callback.error - An Error object if an error occurred, or null if successful.
     * @param {Object} callback.response - The parsed JSON response from the server, or an empty object if an error occurred.
     * @param {Array<Item>} callback.items - The items sent in the request.
     * @returns {void}
     * @throws {Error} - If a socket error occurs or if the socket times out.
     */
    public send(callback: any) {
        callback = (typeof callback !== 'undefined') ? callback : () => { };

        // Create a new TCP socket
        let self = this,
            error = false,
            items = this.items,
            data = this.prepareData(items, this._withTimestamps),
            client = new Net.Socket(),
            response = Buffer.alloc(0);

        this.clearItems();

        // Set the socket timeout
        client.setTimeout(this._timeout);

        // Connect to the Zabbix server
        client.connect(this._serverPort, this._serverHost, () => {
            // Send the data to the Zabbix server
            client.write(data);
        });

        client.on('data', (chunk) => {
            // Concatenate the response
            response = Buffer.concat([response, chunk]);
        });

        client.on('timeout', () => {
            client.destroy();
            throw new Error('Socket timed out after' + this._timeout / 1000 + 'seconds')
        });

        client.on('error', (err) => {
            client.destroy();
            throw new Error('Socket error: ' + err.message)
        });

        client.on('close', () => {
            // Quit on any type of error
            if (error) {
                self.items = self.items.concat(items);
                return callback(error, {});
            }

            // Check if the response is valid
            if (response.subarray(0, 5).toString() !== 'ZBXD\x01') {
                // in case of bad response, put the items back
                self.items = self.items.concat(items);
                return callback(new Error("got invalid response from server"), {});
            }

            const jsonData = response.slice(13);
            // Convert the buffer to a string and parse it as JSON
            const responseString = jsonData.toString();
            callback(null, JSON.parse(responseString), items);
        });
    }

    /**
     * Prepares the data to be sent to the Zabbix server by converting it into the Zabbix protocol format.
     * The resulting buffer includes a header with the Zabbix protocol information and the payload containing the items.
     *
     * @private
     * @param {Item[]} items - An array of items to be sent to the Zabbix server.
     * @param {boolean} withTimeStamp - A flag indicating whether timestamps should be included in the data.
     * @returns {Buffer} - The concatenated buffer of the Zabbix protocol header and the JSON stringified payload, ready to be sent to the server.
     */
    private prepareData(items: Item[], withTimeStamp: boolean) {
        // Create a new object with the `request` and `data` properties
        const data = {
            "request": 'sender data',
            "data": items,
        };

        if (withTimeStamp) {
            data['clock'] = Date.now() / 1000 | 0;;
        }

        // Return the `data` object as a JSON string
        const payload = Buffer.from(JSON.stringify(data), 'utf8');

        // Create a new buffer with a length of 5 + 4 bytes
        const header = Buffer.alloc(5 + 4);

        // Write the Zabbix protocol header to the `header` buffer
        header.write('ZBXD\x01');

        // Write the payload length to the `header` buffer
        header.writeInt32LE(payload.length, 5);

        // Return the concatenated `header` and `payload` buffers
        // log(Buffer.concat([header, Buffer.from("\x00\x00\x00\x00"), payload]).toString('ascii'));
        return Buffer.concat([header, Buffer.from("\x00\x00\x00\x00"), payload]);
    }

    public _test_prepareData(items: Item[], withTimeStamp: boolean) {
        return this.prepareData(items, withTimeStamp);
    }
};