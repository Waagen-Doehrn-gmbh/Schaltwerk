# dokumentation/models.py
from django.db import models
from datetime import date
from django.urls import reverse
from django.contrib.auth.models import User, Group
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal
from django.db.models import Sum
from django.core.exceptions import ValidationError
from django.conf import settings
from django.utils import timezone
import json
import urllib.request
import urllib.parse
import urllib.error

# Erweitere das User-Model um technische Berechtigungen
def user_can_perform_technical_acceptance(user):
    """Prüft ob ein Benutzer technische Abnahmen durchführen darf."""
    if not user or not user.is_authenticated:
        return False
    
    # Admins/Staff können immer technische Abnahmen durchführen
    if user.is_staff:
        return True
    
    # Benutzer in der "Technische Mitarbeiter" Gruppe können auch technische Abnahmen durchführen
    technical_group = Group.objects.filter(name='Technische Mitarbeiter').first()
    if technical_group and user.groups.filter(id=technical_group.id).exists():
        return True
    
    return False

# Füge die Methode zum User-Model hinzu
User.add_to_class('can_perform_technical_acceptance', user_can_perform_technical_acceptance)


class TeamsConfiguration(models.Model):
    """Konfiguration für Microsoft Teams Integration."""
    
    webhook_url = models.URLField(
        "Teams Webhook URL",
        help_text="Die Webhook-URL von Microsoft Teams für Benachrichtigungen"
    )
    enabled = models.BooleanField(
        "Aktiviert",
        default=True,
        help_text="Aktiviert/deaktiviert Teams-Benachrichtigungen"
    )
    notify_technical_acceptance = models.BooleanField(
        "Technische Abnahmen benachrichtigen",
        default=True,
        help_text="Benachrichtigt bei technischen Abnahmen"
    )
    notify_technical_acceptance_failed = models.BooleanField(
        "Fehlgeschlagene technische Abnahmen benachrichtigen",
        default=True,
        help_text="Benachrichtigt bei fehlgeschlagenen technischen Abnahmen"
    )
    notify_technical_acceptance_success = models.BooleanField(
        "Erfolgreiche technische Abnahmen benachrichtigen",
        default=False,
        help_text="Benachrichtigt bei erfolgreichen technischen Abnahmen"
    )
    notify_rueckfragen = models.BooleanField(
        "Rückfragen benachrichtigen",
        default=True,
        help_text="Benachrichtigt bei neuen Rückfragen"
    )
    notify_rueckfragen_answers = models.BooleanField(
        "Rückfragen-Antworten benachrichtigen",
        default=True,
        help_text="Benachrichtigt bei Antworten auf Rückfragen"
    )
    
    created_at = models.DateTimeField("Erstellt am", auto_now_add=True)
    updated_at = models.DateTimeField("Aktualisiert am", auto_now=True)
    
    class Meta:
        verbose_name = "Teams Konfiguration"
        verbose_name_plural = "Teams Konfigurationen"
    
    def __str__(self):
        return f"Teams Integration ({'Aktiviert' if self.enabled else 'Deaktiviert'})"
    
    def send_teams_message(self, title, message, color="0078D4"):
        """Sendet eine Nachricht an Microsoft Teams."""
        logger.info(f"Teams message attempt: enabled={self.enabled}, webhook_url={bool(self.webhook_url)}")
        
        if not self.enabled or not self.webhook_url:
            logger.warning("Teams webhook disabled or no URL configured")
            return False
        
        try:
            # Verwende die lokale Zeit (Europe/Berlin)
            from datetime import datetime, timedelta
            
            # Hole die aktuelle UTC-Zeit und füge 2 Stunden hinzu (CET/CEST)
            utc_now = datetime.utcnow()
            # Einfache Lösung: +2 Stunden für Deutschland
            local_time = utc_now + timedelta(hours=2)
            timestamp = local_time.strftime('%d.%m.%Y %H:%M')
            
            # Versuche verschiedene Power Automate Formate
            formats_to_try = [
                # Format 1: Einfache aber professionelle Teams Adaptive Card
                {
                    "attachments": [{
                        "contentType": "application/vnd.microsoft.card.adaptive",
                        "content": {
                            "type": "AdaptiveCard",
                            "version": "1.0",
                            "body": [
                                {
                                    "type": "Container",
                                    "style": "emphasis",
                                    "items": [
                                        {
                                            "type": "TextBlock",
                                            "text": title,
                                            "weight": "Bolder",
                                            "size": "Large",
                                            "color": "Attention" if "fehlgeschlagen" in title else "Good",
                                            "horizontalAlignment": "Center"
                                        }
                                    ]
                                },
                                {
                                    "type": "TextBlock",
                                    "text": "━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
                                    "horizontalAlignment": "Center",
                                    "color": "Default"
                                },
                                {
                                    "type": "TextBlock",
                                    "text": message,
                                    "wrap": True,
                                    "spacing": "Medium"
                                },
                                {
                                    "type": "TextBlock",
                                    "text": "━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
                                    "horizontalAlignment": "Center",
                                    "color": "Default"
                                },
                                {
                                    "type": "TextBlock",
                                    "text": f"🕐 **Zeitstempel:** {timestamp}",
                                    "weight": "Bolder",
                                    "size": "Small",
                                    "color": "Default",
                                    "horizontalAlignment": "Right"
                                }
                            ]
                        }
                    }]
                },
                # Format 2: Standard Power Automate Format
                {
                    "value1": title,
                    "value2": message,
                    "value3": f"Zeit: {timestamp}"
                },
                # Format 3: Einfaches Format
                {
                    "title": title,
                    "message": message,
                    "timestamp": timestamp
                }
            ]
            
            for i, payload in enumerate(formats_to_try, 1):
                logger.info(f"Teams payload (Format {i}): {json.dumps(payload, indent=2)}")
                
                # Konvertiere Payload zu JSON
                json_data = json.dumps(payload).encode('utf-8')
                
                # Verwende die korrekte Power Automate Direct API URL
                webhook_url = self.webhook_url
                
                # Debug: Logge die ursprüngliche URL
                logger.info(f"Original webhook URL: {webhook_url}")
                
                # Prüfe ob die URL vollständig ist
                if 'powerautomate/automations/direct/workflows' in webhook_url and 'api-version=' in webhook_url and 'sig=' in webhook_url:
                    # Das ist bereits eine vollständige Direct API URL - verwende sie direkt
                    logger.info("Using complete Power Automate Direct API URL directly")
                else:
                    # Verwende die korrekte URL für Tests (die URL im Admin ist unvollständig)
                    webhook_url = "https://defaultc38845813fbc4e818d5edcd7ccc47c.32.environment.api.powerplatform.com/powerautomate/automations/direct/workflows/93a6c43eb5474152b8b01ca48d2e1c3c/triggers/manual/paths/invoke/?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=pLAIqQPKp_Y66y7wA0ZH5cSOjm6pmxT4Xw37DYSqe4M"
                    logger.info("Using hardcoded Power Automate Direct API URL for testing (admin URL was incomplete)")
                
                # Erstelle Request mit minimalen Headers für Power Automate
                # Power Automate Direct API funktioniert oft besser mit weniger Headers
                req = urllib.request.Request(
                    webhook_url,
                    data=json_data,
                    headers={'Content-Type': 'application/json'},
                    method='POST'
                )
                
                logger.info(f"Sending Teams request to: {webhook_url}")
                
                try:
                    # Sende Request mit kürzerem Timeout
                    with urllib.request.urlopen(req, timeout=5) as response:
                        response_data = response.read().decode('utf-8')
                        logger.info(f"Teams response: status={response.status}, data={response_data}")
                        
                        if response.status in [200, 202]:
                            logger.info(f"Teams message sent successfully with format {i} (status: {response.status})")
                            return True
                        else:
                            logger.warning(f"Teams webhook failed with format {i}: {response.status} - {response_data}")
                            continue
                            
                except urllib.error.HTTPError as e:
                    error_body = e.read().decode('utf-8') if e.fp else 'No error body'
                    logger.warning(f"Teams HTTP error with format {i} {e.code}: {e.reason} - {error_body}")
                    continue
            
            logger.error("All Teams payload formats failed")
            return False
                
        except Exception as e:
            logger.error(f"Teams webhook error: {e}")
            return False
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
import logging
import qrcode
import io
import os

logger = logging.getLogger(__name__)


class Komponente(models.Model):
    """
    Stammdaten für wiederverwendbare Komponenten in Schaltschränken.
    """
    name = models.CharField("Komponentenname", max_length=150, unique=True, db_index=True)
    beschreibung = models.TextField("Beschreibung", blank=True, null=True)
    artikelnummer = models.CharField("Artikelnummer", max_length=100, blank=True, null=True, db_index=True)
    vordefinierte_zeit = models.DecimalField(
        "Vordefinierte Zeit (Std)",
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal('0.01')), MaxValueValidator(Decimal('999.99'))],
        help_text="Standardzeit für den Einbau/Bearbeitung in Stunden (z.B. 0.75 für 45 Min)."
    )
    checklist_required = models.BooleanField(
        "Checkliste erforderlich",
        default=False,
        help_text="Wenn aktiviert, muss eine Checkliste abgehakt werden, bevor die Komponente als fertig markiert werden kann."
    )
    grundplatte_komponente = models.BooleanField(
        "Grundplatte-Komponente",
        default=False,
        help_text="Wenn aktiviert, wird diese Komponente automatisch in der Grundplatte-Checkliste angezeigt."
    )

    def __str__(self):
        return self.name

    def clean(self):
        super().clean()
        if self.vordefinierte_zeit is not None and self.vordefinierte_zeit <= 0:
            raise ValidationError({'vordefinierte_zeit': 'Die Zeit muss größer als 0 sein.'})

    class Meta:
        verbose_name = "Komponente"
        verbose_name_plural = "Komponenten (Stammdaten)"
        ordering = ['name']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['artikelnummer']),
        ]


class KomponenteChecklistItem(models.Model):
    """
    Einzelne Checklisten-Punkte für Komponenten.
    """
    komponente = models.ForeignKey(
        Komponente,
        on_delete=models.CASCADE,
        related_name='checklist_items',
        verbose_name="Komponente"
    )
    text = models.CharField("Checklisten-Punkt", max_length=200)
    order = models.PositiveIntegerField("Reihenfolge", default=0)
    required = models.BooleanField("Erforderlich", default=True)
    
    def __str__(self):
        return f"{self.komponente.name}: {self.text}"
    
    class Meta:
        verbose_name = "Checklisten-Punkt"
        verbose_name_plural = "Checklisten-Punkte"
        ordering = ['komponente', 'order', 'id']
        indexes = [
            models.Index(fields=['komponente', 'order']),
        ]




class Schaltschrank(models.Model):
    """
    Repräsentiert einen einzelnen Schaltschrank oder ein Projekt.
    """
    STATUS_CHOICES = [
        ('IN_PROGRESS', 'In Bearbeitung'),
        ('COMPLETED', 'Fertiggestellt'),
        ('PLANNED', 'Geplant')
    ]
    identifier = models.CharField(
        "Kennung / Projektname", max_length=150,
        help_text="Allgemeine Bezeichnung oder Projektzuordnung des Schranks."
    )
    schranknummer = models.CharField(
        "Schaltschranknummer", max_length=50, unique=True, null=True, blank=True, db_index=True,
        help_text="Eindeutige Nummer des Schaltschranks (z.B. 25-001-01)."
    )
    standort = models.CharField(
        "Standort", max_length=150, blank=True, null=True,
        help_text="Ort, an dem der Schaltschrank installiert wird (z.B. Berlin)."
    )
    description = models.TextField("Beschreibung", blank=True, null=True)
    status = models.CharField("Status", max_length=20, choices=STATUS_CHOICES, default='PLANNED', db_index=True)
    created_at = models.DateTimeField("Erstellt am", auto_now_add=True)
    updated_at = models.DateTimeField("Zuletzt geändert", auto_now=True)
    relevante_komponenten = models.ManyToManyField(
        Komponente,
        related_name='relevante_fuer_schraenke',
        blank=True,
        verbose_name="Relevante Komponenten für diesen Schrank",
        help_text="Komponenten, die für diesen spezifischen Schrank vorgesehen sind."
    )
    qr_code_image = models.ImageField(
        "QR-Code Bild",
        upload_to='qr_codes/',
        blank=True,
        null=True,
        help_text="Automatisch generierter QR-Code für diesen Schaltschrank."
    )
    
    pdf_zusammenstellung = models.FileField(
        "PDF Zusammenstellung",
        upload_to='schaltschrank_pdfs/zusammenstellung/',
        blank=True,
        null=True,
        help_text="PDF-Dokument mit der Zusammenstellung für diesen Schaltschrank."
    )
    
    pdf_schaltplan = models.FileField(
        "PDF Schaltplan",
        upload_to='schaltschrank_pdfs/schaltplan/',
        blank=True,
        null=True,
        help_text="PDF-Dokument mit dem Schaltplan für diesen Schaltschrank."
    )
    
    # Nacharbeiten-Felder
    requires_repair = models.BooleanField(
        "Nacharbeiten erforderlich",
        default=False,
        help_text="Zeigt an, dass dieser Schrank Nacharbeiten benötigt (z.B. fehlgeschlagene Abnahme)."
    )
    repair_completed = models.BooleanField(
        "Nacharbeiten erledigt",
        default=False,
        help_text="Zeigt an, dass die Nacharbeiten abgeschlossen wurden."
    )
    repair_in_progress = models.BooleanField(
        "Nacharbeiten in Arbeit",
        default=False,
        help_text="Zeigt an, dass an den Nacharbeiten gearbeitet wird."
    )

    def __str__(self):
        return f"{self.identifier} ({self.schranknummer or 'Nr. fehlt'}) - {self.get_status_display()}"

    def get_absolute_url(self):
        """ Gibt die URL zur Detailansicht dieses Schranks zurück. """
        return reverse('dokumentation:cabinet_detail', kwargs={'pk': self.pk})

    def calculate_total_hours(self):
        """ PERFORMANCE OPTIMIZED: Berechnet die Summe aller Stunden mit Caching. """
        from django.core.cache import cache
        
        # Use cache for expensive calculation (5 minute cache)
        cache_key = f'cabinet_hours_{self.pk}'
        cached_hours = cache.get(cache_key)
        
        if cached_hours is not None:
            return cached_hours
            
        try:
            total_data = self.worklogs.aggregate(total_sum=Sum('stunden'))
            total_hours = total_data.get('total_sum') or Decimal('0.00')
            result = total_hours.quantize(Decimal("0.01"))
            
            # Cache the result for 5 minutes
            cache.set(cache_key, result, 300)
            return result
        except Exception as e:
            logger.error(f"Error calculating total hours for cabinet {self.pk}: {e}")
            return Decimal('0.00')

    def calculate_progress_percentage(self):
        """
        Berechnet flexiblen Fortschrittsprozentsatz basierend auf:
        - 70% für Komponenten (gleichmäßig verteilt auf alle relevanten Komponenten)
        - 30% für durchgeführte Aufgaben (gleichmäßig verteilt auf alle Logs mit Tasks)
        """
        from django.core.cache import cache
        
        cache_key = f'cabinet_progress_{self.pk}'
        cached_progress = cache.get(cache_key)
        if cached_progress is not None:
            return cached_progress
            
        try:
            # Komponenten-Fortschritt (70%)
            total_components = self.relevante_komponenten.count()
            if total_components > 0:
                completed_components = self.worklogs.filter(
                    abgeschlossene_komponenten__isnull=False
                ).values('abgeschlossene_komponenten').distinct().count()
                component_progress = min((completed_components / total_components) * 70, 70)
            else:
                component_progress = 0
            
            # Aufgaben-Fortschritt (30%) 
            # Jeder WorkLog mit einer PredefinedTask zählt als eine durchgeführte Aufgabe
            task_logs_count = self.worklogs.filter(predefined_task__isnull=False).count()
            
            # Flexibel: 30% aufgeteilt auf basis der bisherigen Aufgaben
            # Mindestens 6 Aufgaben für vollen Task-Progress (5% pro Aufgabe)
            max_expected_tasks = max(6, task_logs_count) if task_logs_count > 0 else 6
            task_progress = min((task_logs_count / max_expected_tasks) * 30, 30) if max_expected_tasks > 0 else 0
            
            # Gesamt-Fortschritt
            total_progress = round(component_progress + task_progress, 1)
            total_progress = min(total_progress, 100)  # Max 100%
            
            # DEBUG: Log progress calculation
            logger.info(f"Cabinet {self.identifier}: Components {completed_components}/{total_components} ({component_progress}%), Tasks {task_logs_count} ({task_progress}%), Total: {total_progress}%")
            
            # Cache für 2 Minuten (häufig aktualisiert)
            cache.set(cache_key, total_progress, 120)
            return total_progress
            
        except Exception as e:
            logger.error(f"Error calculating progress for cabinet {self.pk}: {e}")
            return 0.0

    def get_progress_details(self):
        """
        Gibt detaillierte Fortschrittsinformationen zurück für Dashboard-Anzeige
        """
        try:
            total_components = self.relevante_komponenten.count()
            completed_components = self.worklogs.filter(
                abgeschlossene_komponenten__isnull=False
            ).values('abgeschlossene_komponenten').distinct().count()
            
            task_logs_count = self.worklogs.filter(predefined_task__isnull=False).count()
            total_logs_count = self.worklogs.count()
            
            return {
                'total_progress': self.calculate_progress_percentage(),
                'components': {
                    'completed': completed_components,
                    'total': total_components,
                    'percentage': round((completed_components / total_components * 100) if total_components > 0 else 0, 1)
                },
                'tasks': {
                    'completed': task_logs_count,
                    'total_logs': total_logs_count,
                    'percentage': round((task_logs_count / max(6, task_logs_count) * 100) if task_logs_count > 0 else 0, 1)
                }
            }
        except Exception as e:
            logger.error(f"Error getting progress details for cabinet {self.pk}: {e}")
            return {
                'total_progress': 0.0,
                'components': {'completed': 0, 'total': 0, 'percentage': 0},
                'tasks': {'completed': 0, 'total_logs': 0, 'percentage': 0}
            }

    def generate_qr_code(self, request=None):
        """
        Generiert einen QR-Code für den Schaltschrank mit direktem Link.
        Der QR-Code enthält die URL zum Schaltschrank-Detail.
        """
        try:
            # QR-Code erstellen
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=10,
                border=4,
            )
            
            # Öffentliche QR-Code URL erstellen (leitet zur Login-Seite weiter wenn nicht angemeldet)
            if request:
                # Mit Request-Objekt für absolute URL
                from django.urls import reverse
                cabinet_url = request.build_absolute_uri(reverse('dokumentation:qr_redirect', kwargs={'pk': self.pk}))
            else:
                # Fallback: Relative URL (kann manuell ergänzt werden)
                cabinet_url = f"/doku/qr/{self.pk}/"
            
            # URL als QR-Code Inhalt
            qr.add_data(cabinet_url)
            qr.make(fit=True)

            # Bild erstellen
            qr_image = qr.make_image(fill_color="black", back_color="white")
            
            # In BytesIO speichern
            qr_buffer = io.BytesIO()
            qr_image.save(qr_buffer, format='PNG')
            qr_buffer.seek(0)
            
            # Dateiname generieren (basierend auf ID und Titel)
            safe_name = ''.join(c for c in self.identifier if c.isalnum() or c in (' ', '-', '_')).rstrip()
            safe_name = safe_name.replace(' ', '_').replace('-', '_')[:30]  # Max 30 Zeichen
            filename = f"qr_cabinet_{self.pk}_{safe_name}.png"
            
            # In Django ImageField speichern
            self.qr_code_image.save(
                filename,
                ContentFile(qr_buffer.getvalue()),
                save=False
            )
            
            logger.info(f"QR-Code with URL generated successfully for cabinet {self.identifier} (ID: {self.pk})")
            return True
            
        except Exception as e:
            logger.error(f"Error generating QR-Code for cabinet {self.pk}: {e}")
            return False

    def get_qr_display_data(self):
        """
        Gibt die Daten für die QR-Code Anzeige zurück (für Template/Druckansicht).
        """
        return {
            'cabinet_title': self.identifier,
            'cabinet_number': self.schranknummer or 'Nummer fehlt',
            'qr_code_url': self.qr_code_image.url if self.qr_code_image else None,
            'location': self.standort or '',
            'created_date': self.created_at.strftime('%d.%m.%Y')
        }

    def save(self, *args, **kwargs):
        """
        Überschreibt save() um automatisch QR-Code zu generieren bei neuen Schaltschränken.
        QR-Code wird erst beim ersten Aufruf der View generiert (für korrekte URL).
        """
        super().save(*args, **kwargs)

    def clean(self):
        super().clean()
        if self.schranknummer and len(self.schranknummer.strip()) == 0:
            raise ValidationError({'schranknummer': 'Schranknummer darf nicht nur aus Leerzeichen bestehen.'})

    class Meta:
        verbose_name = "Schaltschrank"
        verbose_name_plural = "Schaltschränke"
        ordering = ['identifier']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['schranknummer']),
            models.Index(fields=['created_at']),
            models.Index(fields=['status', 'created_at']),
            # PERFORMANCE: Additional composite indexes for common queries
            models.Index(fields=['status', 'identifier']),
            models.Index(fields=['identifier', 'schranknummer']),
        ]


class PredefinedTask(models.Model):
    """
    Verwaltbare Liste von vordefinierten Aufgaben für Arbeitsprotokolle.
    Kann optional auf Admins beschränkt werden.
    """
    name = models.CharField("Aufgabenbeschreibung", max_length=200, unique=True, db_index=True)
    task_code = models.CharField(
        "Interner Code",
        max_length=50,
        unique=True,
        blank=True,
        null=True,
        db_index=True,
        help_text="Eindeutiger Code für spezielle Aufgaben (z.B. 'KOMP_EINBAU'). Normalerweise leer lassen."
    )
    # Feld zur Beschränkung auf Admins
    admin_only = models.BooleanField(
        "Nur für Admins",
        default=False,
        help_text="Wenn aktiviert, kann diese Aufgabe nur von Admins/Staff-Benutzern ausgewählt werden."
    )
    # Feld für technische Abnahmen
    technical_acceptance = models.BooleanField(
        "Technische Abnahme",
        default=False,
        help_text="Wenn aktiviert, kann diese Aufgabe von technischen Mitarbeitern und Admins ausgewählt werden."
    )

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Vordefinierte Aufgabe"
        verbose_name_plural = "Vordefinierte Aufgaben"
        ordering = ['name']
        indexes = [
            models.Index(fields=['admin_only']),
            models.Index(fields=['technical_acceptance']),
            models.Index(fields=['task_code']),
        ]


class WorkLog(models.Model):
    """
    Ein einzelner Eintrag im Arbeitsprotokoll für einen Schaltschrank.
    Verwendet einen ForeignKey zu PredefinedTask.
    """
    schaltschrank = models.ForeignKey(
        Schaltschrank,
        on_delete=models.CASCADE,
        related_name='worklogs',
        verbose_name="Zugehöriger Schaltschrank",
        null=True,
        blank=True
    )
    employee = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Mitarbeiter"
    )
    work_date = models.DateField("Datum", default=date.today, db_index=True)

    predefined_task = models.ForeignKey(
        PredefinedTask,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Durchgeführte Aufgabe",
        related_name='task_worklogs'
    )

    details = models.TextField("Details / Abweichungen", blank=True, null=True)
    created_at = models.DateTimeField("Erstellt am", auto_now_add=True)

    abgeschlossene_komponenten = models.ManyToManyField(
        Komponente,
        related_name='abgeschlossen_in_logs',
        blank=True,
        verbose_name="Abgeschlossene Komponenten"
    )
    stunden = models.DecimalField(
        "Zeitaufwand (Std)",
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal('0.01')), MaxValueValidator(Decimal('24.00'))],
        help_text="Zeit in Stunden (z.B. 0.5 für 30 Min). Maximal 24 Stunden pro Eintrag."
    )
    
    # Nacharbeiten-Felder
    requires_repair = models.BooleanField(
        "Nacharbeiten erforderlich",
        default=False,
        help_text="Zeigt an, dass dieser Arbeitsschritt Nacharbeiten erfordert."
    )
    repair_reason = models.TextField(
        "Grund für Nacharbeiten",
        blank=True,
        null=True,
        help_text="Beschreibung der gefundenen Mängel oder Gründe für Nacharbeiten."
    )

    def is_acceptance_task(self):
        """Prüft ob es sich um eine Abnahme-Aufgabe handelt."""
        if not self.predefined_task:
            return False
        task_name = self.predefined_task.name.lower()
        return 'technische abnahme' in task_name or 'geschäftsleitung abnahme' in task_name
    
    def clean(self):
        super().clean()
        if self.stunden is not None and self.stunden > Decimal('24.00'):
            raise ValidationError({'stunden': 'Arbeitszeit darf nicht mehr als 24 Stunden pro Eintrag betragen.'})
        if self.work_date and self.work_date > date.today():
            raise ValidationError({'work_date': 'Datum darf nicht in der Zukunft liegen.'})
        if self.requires_repair and not self.repair_reason:
            raise ValidationError({'repair_reason': 'Bei Nacharbeiten muss der Grund angegeben werden.'})

    def __str__(self):
        try:
            employee_name = self.employee.get_full_name() or self.employee.username if self.employee else "Unbekannt"
            task_display = self.predefined_task.name if self.predefined_task else "N/A"
            cabinet_display = self.schaltschrank.identifier if self.schaltschrank else "Unbekannt"
            zeit_display = f"({self.stunden} Std)" if self.stunden else ""
            return f"Log für {cabinet_display} von {employee_name} am {self.work_date.strftime('%d.%m.%Y')} - {task_display} {zeit_display}"
        except Exception as e:
            logger.error(f"Error in WorkLog __str__ method: {e}")
            return f"WorkLog {self.pk or 'New'}"

    class Meta:
        verbose_name = "Arbeitsprotokoll"
        verbose_name_plural = "Arbeitsprotokolle"
        ordering = ['-work_date', '-created_at']
        indexes = [
            models.Index(fields=['-work_date', '-created_at']),
            models.Index(fields=['schaltschrank', '-work_date']),
            models.Index(fields=['employee', '-work_date']),
            models.Index(fields=['work_date']),
            # PERFORMANCE: Additional indexes for statistics and aggregations
            models.Index(fields=['schaltschrank', 'employee', 'work_date']),
            models.Index(fields=['stunden'], condition=models.Q(stunden__isnull=False), name='worklog_stunden_notnull_idx'),
            models.Index(fields=['predefined_task', 'work_date']),
        ]


class KomponenteCompletionChecklist(models.Model):
    """
    Speichert welche Checklisten-Punkte bei der Komponenten-Fertigstellung abgehakt wurden.
    """
    worklog = models.ForeignKey(
        WorkLog,
        on_delete=models.CASCADE,
        related_name='completion_checklists',
        verbose_name="Arbeitsprotokoll"
    )
    komponente = models.ForeignKey(
        Komponente,
        on_delete=models.CASCADE,
        verbose_name="Komponente"
    )
    checked_items = models.ManyToManyField(
        KomponenteChecklistItem,
        verbose_name="Abgehakte Punkte"
    )
    completed_at = models.DateTimeField("Abgeschlossen am", auto_now_add=True)
    
    def __str__(self):
        return f"Checkliste für {self.komponente.name} in {self.worklog}"
    
    class Meta:
        verbose_name = "Komponenten-Checkliste"
        verbose_name_plural = "Komponenten-Checklisten"
        unique_together = ['worklog', 'komponente']
        indexes = [
            models.Index(fields=['worklog', 'komponente']),
        ]


class UserProfile(models.Model):
    """
    Erweiterte Benutzerprofile für personalisierte Features und Einstellungen.
    """
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        related_name='profile',
        verbose_name="Benutzer"
    )
    
    # Personal Information
    phone = models.CharField("Telefon", max_length=50, blank=True, null=True)
    department = models.CharField("Abteilung", max_length=100, blank=True, null=True)
    employee_id = models.CharField("Mitarbeiter-ID", max_length=50, blank=True, null=True)
    
    # Profile Settings
    avatar = models.ImageField(
        "Profilbild", 
        upload_to='profile_avatars/', 
        blank=True, 
        null=True,
        help_text="Optionales Profilbild (max. 2MB)"
    )
    
    # App Preferences
    preferred_theme = models.CharField(
        "Bevorzugtes Theme",
        max_length=20,
        choices=[
            ('light', 'Hell'),
            ('dark', 'Dunkel'), 
            ('auto', 'Automatisch')
        ],
        default='auto'
    )
    
    language = models.CharField(
        "Sprache",
        max_length=10,
        choices=[
            ('de', 'Deutsch'),
            ('en', 'English')
        ],
        default='de'
    )
    
    # Notification Preferences
    email_notifications = models.BooleanField("E-Mail Benachrichtigungen", default=True)
    push_notifications = models.BooleanField("Push Benachrichtigungen", default=True)
    
    # Work Preferences
    default_work_hours = models.DecimalField(
        "Standard Arbeitszeit pro Tag (Std)",
        max_digits=4,
        decimal_places=2,
        default=Decimal('8.00'),
        validators=[MinValueValidator(Decimal('0.25')), MaxValueValidator(Decimal('24.00'))]
    )
    
    # QR Scanner Settings
    qr_scan_sound = models.BooleanField("QR-Scanner Ton", default=True)
    qr_auto_navigation = models.BooleanField("Automatische Navigation nach QR-Scan", default=True)
    
    # Timestamps
    created_at = models.DateTimeField("Erstellt am", auto_now_add=True)
    updated_at = models.DateTimeField("Zuletzt geändert", auto_now=True)
    
    def __str__(self):
        return f"Profil: {self.user.get_full_name() or self.user.username}"
    
    def get_total_work_hours(self):
        """Berechnet die Gesamtarbeitszeit des Benutzers"""
        from django.db.models import Sum
        total = self.user.worklog_set.aggregate(total=Sum('stunden'))['total']
        return total or Decimal('0.00')
    
    def get_recent_projects(self, limit=5):
        """Gibt die letzten Projekte des Benutzers zurück"""
        return self.user.worklog_set.select_related('schaltschrank')\
                   .values('schaltschrank__id', 'schaltschrank__identifier')\
                   .distinct().order_by('-created_at')[:limit]
    
    class Meta:
        verbose_name = "Benutzerprofil" 
        verbose_name_plural = "Benutzerprofile"
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['department']),
            models.Index(fields=['employee_id']),
        ]


class QRScanLog(models.Model):
    """
    Protokoll für QR-Code Scans zur Analyse und Optimierung.
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='qr_scans',
        verbose_name="Benutzer"
    )
    
    qr_content = models.CharField("QR-Code Inhalt", max_length=500)
    schaltschrank = models.ForeignKey(
        Schaltschrank,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        verbose_name="Zugeordneter Schaltschrank"
    )
    
    scan_successful = models.BooleanField("Scan erfolgreich", default=True)
    error_message = models.TextField("Fehlermeldung", blank=True, null=True)
    
    # Location data (optional)
    latitude = models.DecimalField(
        "Breitengrad", 
        max_digits=10, 
        decimal_places=8, 
        null=True, 
        blank=True
    )
    longitude = models.DecimalField(
        "Längengrad", 
        max_digits=11, 
        decimal_places=8, 
        null=True, 
        blank=True
    )
    
    # Device information
    device_info = models.JSONField("Geräteinformationen", default=dict, blank=True)
    
    scanned_at = models.DateTimeField("Gescannt am", auto_now_add=True)
    
    def __str__(self):
        status = "✅" if self.scan_successful else "❌"
        return f"{status} QR-Scan von {self.user.username} - {self.qr_content[:50]}"
    
    class Meta:
        verbose_name = "QR-Scan Protokoll"
        verbose_name_plural = "QR-Scan Protokolle"
        ordering = ['-scanned_at']
        indexes = [
            models.Index(fields=['user', '-scanned_at']),
            models.Index(fields=['schaltschrank', '-scanned_at']),
            models.Index(fields=['-scanned_at']),
        ]


class RueckfrageAnswer(models.Model):
    """
    Antworten auf Rückfragen von Monteuren.
    Admins können auf Fragen im Arbeitsprotokoll antworten.
    """
    worklog = models.ForeignKey(
        WorkLog,
        on_delete=models.CASCADE,
        related_name='rueckfrage_answers',
        verbose_name="Arbeitsprotokoll mit Rückfrage"
    )
    
    answered_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='rueckfrage_answers_given',
        verbose_name="Beantwortet von"
    )
    
    answer_text = models.TextField(
        "Antwort",
        help_text="Antwort auf die Rückfrage des Monteurs"
    )
    
    created_at = models.DateTimeField("Antwort erstellt am", auto_now_add=True)
    updated_at = models.DateTimeField("Antwort aktualisiert am", auto_now=True)
    
    def __str__(self):
        return f"Antwort auf Rückfrage in {self.worklog} von {self.answered_by.get_full_name() or self.answered_by.username}"
    
    class Meta:
        verbose_name = "Rückfrage Antwort"
        verbose_name_plural = "Rückfrage Antworten"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['worklog', '-created_at']),
            models.Index(fields=['answered_by', '-created_at']),
        ]


class TechnicalAcceptancePhoto(models.Model):
    """Fotos für technische Abnahmen und Rückfragen."""
    
    worklog = models.ForeignKey(
        WorkLog,
        on_delete=models.CASCADE,
        related_name='technical_photos',
        verbose_name="Zugehöriges Arbeitsprotokoll"
    )
    photo = models.ImageField(
        "Foto",
        upload_to='technical_photos/%Y/%m/%d/',
        help_text="Foto für technische Abnahme oder Rückfrage"
    )
    taken_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Aufgenommen von"
    )
    created_at = models.DateTimeField("Erstellt am", auto_now_add=True)
    
    def __str__(self):
        return f"Foto für {self.worklog} - {self.created_at.strftime('%d.%m.%Y %H:%M')}"
    
    class Meta:
        verbose_name = "Technische Abnahme Foto"
        verbose_name_plural = "Technische Abnahme Fotos"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['worklog', '-created_at']),
            models.Index(fields=['taken_by', '-created_at']),
        ]