# Common Network Ports and Protocols: Study Guide

- **Source:** https://www.youtube.com/watch?v=YIaF4cJRB4g
- **Length:** unknown (the pasted transcript had no timestamps) · **Made:** 2026-09-24
- **Studying for:** CompTIA A+ 220-1201/1202

> **About the source:** The transcript was pasted by chapter and had no timestamps, so this
> guide points to **chapters** instead of times. Some topics sit inside another chapter:
> DNS is in *SMTP*, SMB/NetBIOS is in *POP3 / IMAP*, and LDAP is in *SNMP*. The pasted
> text looks like it was tidied up by an AI tool (one link in it was tagged
> `utm_source=gemini`), so check the video before relying on the exact wording.

## The big picture

A port number works like an apartment number. The IP address gets traffic to the right
building (device), and the port gets it to the right door (service). Well-known ports
let clients, servers and the firewalls between them agree on which service a piece of
traffic is for. The lecture goes through about 16 services you'll meet as a technician:
file transfer, remote terminals, email, name lookups, automatic addressing, the web,
Windows file sharing, network monitoring, directories and remote desktop. For each one,
learn the port number and also when you would use it.

## By the end you should be able to

- Match each protocol in the lecture to its port number and to TCP or UDP
- Pick the right protocol when given a description of what an application does
- Explain why SSH should be used instead of Telnet, and HTTPS instead of HTTP
- Tell apart the protocols that send email (SMTP) and receive it (POP3 and IMAP), and
  explain when IMAP is the better choice
- Describe how DHCP uses a pool of addresses, leases and reservations
- Compare Windows file sharing on older systems (NetBIOS, 137/139) with newer ones (SMB, 445)

## Key terms

Each protocol and its port is in the [Compare and contrast](#compare-and-contrast) table.
This table covers the ideas around them.

| Term | What it means | Where |
|---|---|---|
| Port number | A number that says which service on a device the traffic is for | Port numbers |
| Well-known port | The standard port for a service, so both client and server know where to connect | Port numbers |
| Firewall | A device or program that allows or blocks traffic, often based on its port number | Port numbers |
| Anonymous login | An FTP option on some servers that lets anyone log in without a real account | Port numbers |
| In the clear | Sent without encryption, so anyone capturing the traffic can read it | Telnet |
| Packet capture | Recording the network traffic that passes between devices so it can be read later | Telnet |
| Fully qualified domain name (FQDN) | A full name for a host, such as `www.example.com`, which DNS turns into an IP address | SMTP |
| DHCP pool | The range of IP addresses a DHCP server can hand out | DHCP |
| Lease | How long a device may keep an IP address from DHCP before the address goes back to the pool | DHCP |
| DHCP reservation | A setting on the DHCP server that gives one particular device the same IP address every time | DHCP |
| CIFS | Common Internet File System, another name for SMB | POP3 / IMAP |
| SNMP trap | An alert that a device sends by itself to the management station when a measurement goes past a set limit | SNMP |
| Directory | A central database of users, computers and other resources that can be searched (queried) | SNMP |
| Active Directory | Microsoft's very widely used directory service. You query it with LDAP | SNMP |

> **Added context (not from the lecture):** The lecture uses **TCP** and **UDP** without
> defining them.
> - **TCP** (Transmission Control Protocol) sets up a connection first and checks that
>   every piece of data arrives, resending anything that goes missing. It's like
>   tracked mail.
> - **UDP** (User Datagram Protocol) sends data without setting up a connection or
>   checking delivery. It's like a postcard: faster and lighter, which suits short
>   request-and-reply exchanges such as DNS lookups and DHCP.

## Main ideas

### 1. Why port numbers matter (chapter: Port numbers)

- A service listens on a **well-known port** so that clients know where to find it.
- Firewalls read these port numbers to decide which traffic to allow or block.
- Learning the numbers feels like memorising at first, but it gets easier the more you
  use them.
- The lecturer stresses knowing **when** you'd use each protocol. An exam question might
  describe what an application does and ask which port it uses.

### 2. Transferring files and remote terminals: FTP, SSH, Telnet (chapters: Port numbers, Telnet)

- **FTP** (File Transfer Protocol) uses two ports:
  - **TCP 20** carries the data.
  - **TCP 21** controls the transfer.
- FTP usually needs a username and password, although some servers accept an
  **anonymous** login with any password.
- FTP can also manage files on the server: list, add, delete and rename them.
- **SSH** (Secure Shell), **TCP 22**, gives you a text-based terminal on a remote device.
  You see plain text on your screen, but the traffic crossing the network is encrypted.
- **Telnet**, **TCP 23**, does the same job as SSH but sends everything **in the clear**.
  Anyone capturing the traffic can read the usernames and passwords.
- The lecturer's advice: avoid Telnet on production networks and use SSH instead.

### 3. Email: sending vs. receiving (chapters: SMTP, POP3 / IMAP)

- **SMTP** (Simple Mail Transfer Protocol), **TCP 25**, does two jobs:
  - it carries mail between mail servers
  - it's how your email client *sends* a message
- Receiving uses different protocols:
  - **POP3** (Post Office Protocol version 3), **TCP 110**, downloads mail to one email
    client. It wasn't designed for several devices reading the same inbox.
  - **IMAP4** (Internet Message Access Protocol version 4), **TCP 143**, keeps one inbox
    in sync across all your devices, which suits people with a phone, laptop and tablet.

### 4. Finding hosts and joining the network: DNS, DHCP (chapters: SMTP, DHCP)

- **DNS** (Domain Name System), **UDP 53**, turns a name you type (an FQDN) into the IP
  address your computer actually connects to.
- DNS is critical: people don't memorise server IP addresses, and those addresses can
  change without warning.
- **DHCP** (Dynamic Host Configuration Protocol), **UDP 67 and 68**, hands out IP
  settings automatically. That's what happens when you join coffee-shop Wi-Fi.
  - Routers and wireless access points often have a DHCP server built in.
  - The server hands out addresses from its **pool** as devices ask for them.
  - Addresses are **leased**. When the lease runs out and the device has left the
    network, the address goes back into the pool.
  - A **reservation** makes sure devices such as routers, firewalls and switches always
    get the same IP address.
  - The admin then changes those devices' IP settings in one place, on the DHCP server.
    Each device picks up the new settings the next time it asks for an address.

> **Added context (not from the lecture):**
> - DNS also uses **TCP 53**, for copying whole zones between DNS servers (zone
>   transfers) and for replies too large for UDP.
> - For DHCP, **67 is the server** and **68 is the client**. The lecture gives both
>   ports but doesn't say which is which.

### 5. The web: HTTP vs. HTTPS (chapter: HTTP and HTTPS)

- **HTTP** (Hypertext Transfer Protocol), **TCP 80**, is how browsers talk to web
  servers. It isn't encrypted.
- **HTTPS**, **TCP 443**, is the encrypted version. The "S" stands for secure.

### 6. Windows file and printer sharing: SMB and NetBIOS (chapter: POP3 / IMAP)

- **SMB** (Server Message Block), also called **CIFS**, is how Windows computers share
  files and send print jobs.
- **Older Windows** runs SMB over **NetBIOS over TCP/IP** (NetBIOS is short for Network
  Basic Input Output System):
  - **UDP 137** is the name service, which finds devices by name.
  - **TCP 139** sets up the session and moves the data.
- **Modern Windows** doesn't need NetBIOS. It uses **direct SMB** over **TCP 445**.

### 7. Monitoring and directories: SNMP, LDAP (chapter: SNMP)

- **SNMP** (Simple Network Management Protocol) lets a management station collect
  performance figures from routers, switches and other infrastructure devices.
  - **UDP 161**: the management station asks a device for its figures (queries).
  - **UDP 162**: a device sends a **trap**, an alert, when a figure goes past a limit
    that was set.
- SNMP comes in three versions:

  | Version | What it added | Encrypted? |
  |---|---|---|
  | v1 | The original | No |
  | v2 | Bulk transfers (sending lots of data at once) | No |
  | v3 | Message integrity, authentication and encryption | **Yes** |

- **LDAP** (Lightweight Directory Access Protocol), **TCP 389**, is used to search
  (query) directories. Microsoft **Active Directory** is one of the most popular
  directories that uses it.

### 8. Remote desktop: RDP (chapter: RDP)

- **RDP** (Remote Desktop Protocol), **TCP 3389**, is Windows' standard way to share a
  desktop remotely. Help desks use it a lot, and it's built into many editions of
  Windows.
- You can use it to control a whole computer or to run a single application from a
  server.
- RDP servers are almost always Windows. Client apps exist for nearly every system,
  including Linux, macOS and Android.

## Compare and contrast

All the ports from the lecture, in port-number order. "—" means the lecture doesn't say
whether it's encrypted.

| Port(s) | TCP / UDP | Protocol | What it's for | Encrypted? | Chapter |
|---|---|---|---|---|---|
| 20, 21 | TCP | FTP | Transfer and manage files (20 = data, 21 = control) | — | Port numbers |
| 22 | TCP | SSH | Encrypted remote terminal | **Yes** | Port numbers |
| 23 | TCP | Telnet | Remote terminal, in the clear | **No** | Telnet |
| 25 | TCP | SMTP | Send mail and pass it between mail servers | — | SMTP |
| 53 | UDP | DNS | Turn names into IP addresses | — | SMTP |
| 67, 68 | UDP | DHCP | Give out IP settings automatically | — | DHCP |
| 80 | TCP | HTTP | Web browsing | **No** | HTTP and HTTPS |
| 110 | TCP | POP3 | Receive mail to one client | — | POP3 / IMAP |
| 137 | UDP | NetBIOS name service | Find Windows devices by name (older Windows) | — | POP3 / IMAP |
| 139 | TCP | NetBIOS session | SMB sessions and data (older Windows) | — | POP3 / IMAP |
| 143 | TCP | IMAP4 | Receive and sync mail across many devices | — | POP3 / IMAP |
| 161 | UDP | SNMP | The management station asks for figures | v3 only | SNMP |
| 162 | UDP | SNMP traps | A device sends an alert | v3 only | SNMP |
| 389 | TCP | LDAP | Query a directory, such as Active Directory | — | SNMP |
| 443 | TCP | HTTPS | Encrypted web browsing | **Yes** | HTTP and HTTPS |
| 445 | TCP | SMB (direct) | Windows file and printer sharing (modern Windows) | — | POP3 / IMAP |
| 3389 | TCP | RDP | Remote desktop | — | RDP |

Three pairs that do a similar job, side by side:

| | Terminal | Receiving email | Web |
|---|---|---|---|
| **Older or unencrypted** | Telnet, TCP 23 | POP3, TCP 110 (one client) | HTTP, TCP 80 |
| **Preferred today** | SSH, TCP 22 | IMAP4, TCP 143 (many devices, synced) | HTTPS, TCP 443 |

## Exam tips and common mistakes

From the lecture:

- **Learn what each protocol is for, not just its number.** The exam may describe what
  an application does and ask for the port. (Port numbers)
- **Telnet and SSH do the same job.** Only SSH encrypts, so use SSH. (Telnet)
- **SMTP sends and POP3/IMAP receive.** Don't answer SMTP to a question about
  *downloading* or *syncing* mail. (SMTP, POP3 / IMAP)
- **POP3 or IMAP?** If the scenario has several devices reading the same inbox, the
  answer is IMAP. (POP3 / IMAP)
- **SNMP 161 or 162?** 161 is the manager asking. 162 is a trap, where the device raises
  an alert on its own. (SNMP)
- **SMB on 445 or NetBIOS on 137/139?** Modern Windows means direct SMB on 445. Older
  Windows means NetBIOS on 137/139. (POP3 / IMAP)

> **Added context (not from the lecture), memory tricks:**
> - **20, 21, 22, 23, 25** run in a row: FTP data, FTP control, SSH, Telnet, SMTP.
> - Several services use **two ports next to each other**: FTP 20/21, DHCP 67/68,
>   SNMP 161/162.
> - **"S for Secure" only works sometimes.** It's true for SSH and HTTPS. But the S in
>   **SMTP** and **SNMP** stands for **Simple**, so don't assume they're secure.
> - **All UDP in this lecture:** DNS 53, DHCP 67/68, NetBIOS name service 137, SNMP
>   161/162. Everything else is TCP.

## Check yourself

1. What two ports does FTP use, and what does each one do?
2. What's the difference between SNMP traffic on UDP 161 and UDP 162? Which SNMP version
   first adds encryption?
3. A help-desk technician needs to see and control a user's Windows desktop from their
   own desk. Which protocol and port will they most likely use?
4. A firewall log shows a technician connecting to a switch on TCP 23. What protocol is
   that, why is it a problem, and what should they use instead?
5. A user reads email on a phone, a laptop and a tablet. They want messages they've read
   or deleted on one device to show that way on the others. POP3 or IMAP? Which port?
6. Your laptop gets an IP address automatically when you join a café's Wi-Fi. Which
   protocol did that, and which ports does it use?
7. A user can open a website by typing its IP address but not by typing its name. Which
   service is most likely failing, and on which port and transport?
8. A network admin wants the office firewall to always get the same IP address. They
   also want to be able to change its IP settings without touching the firewall itself.
   What DHCP feature does this?
9. A modern Windows 11 PC opens a shared folder on another Windows 11 PC. Which protocol
   and port are used? What would an older Windows system use instead?
10. Which port is used to send an email from your mail client, and which two protocols
    could your client use to receive mail?
11. A script needs to look up user accounts in Active Directory. Which protocol and port?
12. Explain why the lecturer says it isn't enough to memorise port numbers alone.

<details>
<summary>Answers (try the questions first)</summary>

1. **TCP 20** carries the data and **TCP 21** controls the transfer. See the chapter
   *Port numbers*.
2. **161** is the management station asking a device for its performance figures.
   **162** is a **trap**, an alert the device sends by itself when a figure crosses a
   limit. **SNMP v3** first adds encryption, along with message integrity and
   authentication (v1 and v2 are unencrypted). See the chapter *SNMP*.
3. **RDP, TCP 3389**. It's Windows' standard remote desktop protocol and is widely used
   on help desks. See the chapter *RDP*.
4. It's **Telnet**. It sends everything in the clear, so anyone capturing packets can
   read the username and password. Use **SSH on TCP 22** instead. See the chapters
   *Telnet* and *Port numbers*.
5. **IMAP4 on TCP 143**. It keeps one mailbox in sync across many devices. POP3 wasn't
   designed for several clients. See the chapter *POP3 / IMAP*.
6. **DHCP, UDP 67 and 68**. The server is probably built into the café's router or
   access point. See the chapter *DHCP*.
7. **DNS, UDP 53**. Reaching the site by IP address shows the network works, so the
   name-to-address lookup is the part failing. (This applies the lecture's explanation
   of DNS to a troubleshooting case.) See the chapter *SMTP*, where DNS is covered.
8. A **DHCP reservation**. The firewall always gets the same address. Its IP settings
   are changed on the DHCP server, and it picks them up at its next request. See the
   chapter *DHCP*.
9. **Direct SMB (CIFS) on TCP 445**. Older Windows would use NetBIOS over TCP/IP:
   **UDP 137** to find devices by name and **TCP 139** for the session and data. See the
   chapter *POP3 / IMAP*.
10. **SMTP, TCP 25** sends. To receive, the client uses **POP3 (TCP 110)** or
    **IMAP4 (TCP 143)**. See the chapters *SMTP* and *POP3 / IMAP*.
11. **LDAP, TCP 389**. Active Directory is one of the most popular directories that
    uses LDAP. See the chapter *SNMP*, where LDAP is covered.
12. Exam questions and real jobs often describe what an application **does** rather
    than naming the protocol. You need to recognise the job ("syncs mail on every
    device", "encrypted terminal") to reach the right port. Firewalls also make
    decisions by port, so you need to know which traffic each port carries. See the
    chapter *Port numbers*.

</details>

## Still unclear?

- **Which DHCP port is the server and which is the client?** The lecture doesn't say.
  (It's 67 for the server and 68 for the client; see the added context in main idea 4.)
- **Secure versions of FTP, POP3, IMAP and LDAP** weren't covered: SFTP/FTPS, POP3S
  (TCP 995), IMAPS (TCP 993) and LDAPS (TCP 636). Check whether your exam objectives
  list them.
- **Is FTP, SMTP, LDAP or RDP encrypted?** The lecture doesn't say for these. Worth
  asking your teacher or checking the exam objectives.
- **TCP vs. UDP** is used throughout but never explained. Review it if the added context
  above wasn't enough.
