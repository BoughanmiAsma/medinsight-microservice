import React from "react";
import {
  Box,
  Container,
  Toolbar,
  Typography,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Card,
  CardContent,
  Divider,
  Link,
  Chip
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Appbar from "../../components/Appbar";
import HelpIcon from "@mui/icons-material/Help";
import ContactSupportIcon from "@mui/icons-material/ContactSupport";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import BookIcon from "@mui/icons-material/Book";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";

export default function Help() {
  const faqItems = [
    {
      question: "Comment ajouter un nouveau membre du staff ?",
      answer: "Pour ajouter un nouveau membre du staff, allez dans 'Staff Management' dans le menu principal, puis cliquez sur le bouton 'Ajouter un Staff'. Remplissez le formulaire avec les informations requises (nom, prénom, email, téléphone, type, etc.) et cliquez sur 'Enregistrer'."
    },
    {
      question: "Comment modifier les informations d'un patient ?",
      answer: "Accédez à la liste des patients via 'Patient List' dans le menu. Cliquez sur un patient pour voir ses détails, puis utilisez le formulaire pour modifier les informations nécessaires."
    },
    {
      question: "Comment créer un nouveau rendez-vous ?",
      answer: "Allez dans la section 'Appointments' et cliquez sur le bouton pour ajouter un nouveau rendez-vous. Sélectionnez le patient, le médecin, la date et l'heure, puis enregistrez."
    },
    {
      question: "Comment rechercher un membre du staff ?",
      answer: "Dans la page 'Staff Management', utilisez la barre de recherche en haut de la page. Vous pouvez rechercher par nom, prénom ou spécialité."
    },
    {
      question: "Comment supprimer un membre du staff ?",
      answer: "Dans la liste du staff, cliquez sur l'icône de corbeille (rouge) à côté du membre que vous souhaitez supprimer. Confirmez la suppression dans la boîte de dialogue qui apparaît."
    },
    {
      question: "Comment changer le thème de l'application ?",
      answer: "Allez dans 'Settings' dans le menu. Vous pouvez changer entre le mode clair et sombre, ainsi que personnaliser les couleurs et autres paramètres d'affichage."
    }
  ];

  const quickLinks = [
    {
      title: "Documentation",
      description: "Consultez la documentation complète de l'application",
      icon: <BookIcon sx={{ fontSize: 40 }} />,
      color: "primary"
    },
    {
      title: "Vidéos tutoriels",
      description: "Regardez des vidéos pour apprendre à utiliser l'application",
      icon: <VideoLibraryIcon sx={{ fontSize: 40 }} />,
      color: "secondary"
    },
    {
      title: "Support technique",
      description: "Contactez notre équipe de support pour de l'aide",
      icon: <ContactSupportIcon sx={{ fontSize: 40 }} />,
      color: "success"
    }
  ];

  return (
    <Box sx={{ display: "flex" }}>
      <Appbar appBarTitle="Get Help" />
      <Box
        component="main"
        sx={{
          backgroundColor: (theme) =>
            theme.palette.mode === "light"
              ? theme.palette.grey[100]
              : theme.palette.grey[900],
          flexGrow: 1,
          height: "100vh",
          overflow: "auto"
        }}
      >
        <Toolbar />
        <Container sx={{ mt: 4, mb: 4 }}>
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
              <HelpIcon sx={{ fontSize: 48, color: "primary.main" }} />
              <Box>
                <Typography variant="h3" fontWeight={600} gutterBottom>
                  Centre d'aide MEDINSIGHT
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Trouvez des réponses à vos questions et apprenez à utiliser l'application
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Quick Links */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {quickLinks.map((link, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card
                  sx={{
                    height: "100%",
                    transition: "transform 0.2s",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: 4
                    }
                  }}
                >
                  <CardContent sx={{ textAlign: "center", py: 3 }}>
                    <Box sx={{ color: `${link.color}.main`, mb: 2 }}>
                      {link.icon}
                    </Box>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      {link.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {link.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* FAQ Section */}
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h5" fontWeight={600} gutterBottom sx={{ mb: 3 }}>
              Questions fréquemment posées (FAQ)
            </Typography>
            {faqItems.map((item, index) => (
              <Accordion key={index} sx={{ mb: 1 }}>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls={`panel${index}-content`}
                  id={`panel${index}-header`}
                >
                  <Typography fontWeight={500}>{item.question}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography color="text.secondary">{item.answer}</Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Paper>

          {/* Contact Section */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" fontWeight={600} gutterBottom sx={{ mb: 3 }}>
              Besoin d'aide supplémentaire ?
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                  <EmailIcon color="primary" />
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Email
                    </Typography>
                    <Link href="mailto:support@medinsight.com" underline="hover">
                      support@medinsight.com
                    </Link>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                  <PhoneIcon color="primary" />
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Téléphone
                    </Typography>
                    <Link href="tel:+1234567890" underline="hover">
                      +1 (234) 567-890
                    </Link>
                  </Box>
                </Box>
              </Grid>
            </Grid>
            <Divider sx={{ my: 3 }} />
            <Typography variant="body2" color="text.secondary">
              Notre équipe de support est disponible du lundi au vendredi, de 9h à 17h (heure locale).
              Nous répondons généralement dans les 24 heures.
            </Typography>
          </Paper>

          {/* Version Info */}
          <Box sx={{ mt: 4, textAlign: "center" }}>
            <Chip label="Version 1.0.0" variant="outlined" />
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
              © 2024 MEDINSIGHT. Tous droits réservés.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}

